import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADMIN_PASSWORD = "CollZap2026Admin";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const { action, adminPassword } = body as { action: string; adminPassword?: string };

    if (adminPassword !== ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---- LIST: return all users, matches, pending ----
    if (action === "list") {
      const [users, matches, pending] = await Promise.all([
        supabase.from("admin_users_view").select("*").order("created_at", { ascending: false }),
        supabase.from("admin_matches_view").select("*").order("created_at", { ascending: false }),
        supabase.from("admin_pending_view").select("*").order("created_at", { ascending: false }),
      ]);

      return new Response(
        JSON.stringify({
          users: users.data || [],
          matches: matches.data || [],
          pending: pending.data || [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---- MANUAL MATCH ----
    if (action === "manual_match") {
      const { user1Id, user2Id, interestName, connectionType, projectType } = body as {
        user1Id: string;
        user2Id: string;
        interestName: string;
        connectionType: "1-on-1" | "short_group" | "society";
        projectType: "long_term" | "short_term";
      };

      if (!user1Id || !user2Id || !interestName || !connectionType || !projectType) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (user1Id === user2Id) {
        return new Response(
          JSON.stringify({ error: "Cannot match a user with themselves" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Check for existing active match between these two users
      const { data: existing } = await supabase
        .from("matches")
        .select("id")
        .or(`and(user_id.eq.${user1Id},matched_user_id.eq.${user2Id}),and(user_id.eq.${user2Id},matched_user_id.eq.${user1Id})`)
        .in("status", ["matched", "active"])
        .limit(1)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ error: "These users are already matched" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Create chat room
      const { data: room, error: roomErr } = await supabase
        .from("chat_rooms")
        .insert({
          room_type: connectionType,
          project_type: projectType,
          interest_name: interestName,
          connection_type: connectionType,
        })
        .select()
        .maybeSingle();

      if (roomErr || !room) {
        return new Response(
          JSON.stringify({ error: "Failed to create chat room" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Add both users as members
      await supabase.from("chat_room_members").insert([
        { chat_room_id: room.id, user_id: user1Id },
        { chat_room_id: room.id, user_id: user2Id },
      ]);

      // Create bidirectional match records
      await supabase.from("matches").insert([
        {
          user_id: user1Id,
          matched_user_id: user2Id,
          project_type: projectType,
          connection_type: connectionType,
          status: "active",
          chat_room_id: room.id,
        },
        {
          user_id: user2Id,
          matched_user_id: user1Id,
          project_type: projectType,
          connection_type: connectionType,
          status: "active",
          chat_room_id: room.id,
        },
      ]);

      // Remove any pending matches for these users
      await supabase
        .from("matches")
        .delete()
        .in("user_id", [user1Id, user2Id])
        .eq("status", "pending");

      return new Response(
        JSON.stringify({
          success: true,
          chatRoomId: room.id,
          message: "Match created successfully",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---- UNMATCH ----
    if (action === "unmatch") {
      const { matchId } = body as { matchId: string };

      if (!matchId) {
        return new Response(
          JSON.stringify({ error: "Match ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Get the match to find chat_room_id and both users
      const { data: match } = await supabase
        .from("matches")
        .select("id, user_id, matched_user_id, chat_room_id")
        .eq("id", matchId)
        .maybeSingle();

      if (!match) {
        return new Response(
          JSON.stringify({ error: "Match not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Delete both directional match records
      await supabase
        .from("matches")
        .delete()
        .or(`and(user_id.eq.${match.user_id},matched_user_id.eq.${match.matched_user_id}),and(user_id.eq.${match.matched_user_id},matched_user_id.eq.${match.user_id})`);

      // Delete the chat room and its members (cascade handles members/messages)
      if (match.chat_room_id) {
        await supabase.from("chat_rooms").delete().eq("id", match.chat_room_id);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Match removed successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
