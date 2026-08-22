import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LEVEL_ORDER: Record<string, number> = {
  Beginner: 0,
  Learning: 1,
  Intermediate: 2,
  Expert: 3,
};

function levelWithinTolerance(a: string, b: string): boolean {
  const ia = LEVEL_ORDER[a] ?? 0;
  const ib = LEVEL_ORDER[b] ?? 0;
  return Math.abs(ia - ib) <= 1;
}

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
    const { userId, projectTypes, projectType, connectionType, interests, levels, collegeName } = body as {
      userId: string;
      projectTypes?: ("long_term" | "short_term")[];
      projectType?: "long_term" | "short_term";
      connectionType: "1-on-1" | "short_group" | "society";
      interests: string[];
      levels: Record<string, string>;
      collegeName: string;
    };

    // Support both projectTypes (array) and projectType (single, for backward compat)
    const allProjectTypes: ("long_term" | "short_term")[] = projectTypes || (projectType ? [projectType] : []);

    if (!userId || allProjectTypes.length === 0 || !connectionType || !interests?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Use the first project type for this match attempt
    const projectType = allProjectTypes[0];

    // --- SOCIETY: auto-join instantly ---
    if (connectionType === "society") {
      for (const interest of interests) {
        // Find an existing society room for this college + interest
        const { data: existingRoom } = await supabase
          .from("chat_rooms")
          .select("id")
          .eq("room_type", "society")
          .eq("project_type", projectType)
          .eq("interest_name", interest)
          .limit(1)
          .maybeSingle();

        let roomId: string;

        if (existingRoom) {
          roomId = existingRoom.id;
          // Add user as member (ignore if already member)
          await supabase.from("chat_room_members").upsert(
            { chat_room_id: roomId, user_id: userId },
            { onConflict: "chat_room_id,user_id" },
          );
        } else {
          // Create new society room
          const { data: newRoom, error } = await supabase
            .from("chat_rooms")
            .insert({
              room_type: "society",
              project_type: projectType,
              interest_name: interest,
              connection_type: "society",
            })
            .select()
            .maybeSingle();

          if (error || !newRoom) continue;
          roomId = newRoom.id;

          await supabase.from("chat_room_members").insert({
            chat_room_id: roomId,
            user_id: userId,
          });
        }

        // Create match record linked to room
        await supabase.from("matches").insert({
          user_id: userId,
          matched_user_id: null,
          project_type: projectType,
          connection_type: "society",
          status: "active",
          chat_room_id: roomId,
        });
      }

      // Return the first room for immediate chat open
      const { data: room } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("room_type", "society")
        .eq("project_type", projectType)
        .in("interest_name", interests)
        .limit(1)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          matched: true,
          chatRoomId: room?.id ?? null,
          connectionType: "society",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- 1-on-1 and SHORT_GROUP: find a peer ---
    // Get the user's profile to confirm college
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("id, college_name")
      .eq("id", userId)
      .maybeSingle();

    if (!myProfile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Find candidate users: same college, same interest, same project type
    // We query interests of OTHER users that match our interest names + project type
    const { data: candidateInterests } = await supabase
      .from("interests")
      .select("user_id, interest_name, level")
      .in("interest_name", interests)
      .eq("project_type", projectType)
      .neq("user_id", userId);

    if (!candidateInterests || candidateInterests.length === 0) {
      // No candidates — create pending match
      await createPendingMatch(supabase, userId, projectType, connectionType, interests[0]);
      return new Response(
        JSON.stringify({ matched: false, message: "Match in progress" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get candidate user profiles (same college)
    const candidateUserIds = [...new Set(candidateInterests.map((c) => c.user_id))];
    const { data: candidateProfiles } = await supabase
      .from("profiles")
      .select("id, college_name")
      .in("id", candidateUserIds);

    // Filter by same college
    const sameCollegeUserIds = new Set(
      (candidateProfiles || [])
        .filter((p) => p.college_name === myProfile.college_name)
        .map((p) => p.id),
    );

    if (sameCollegeUserIds.size === 0) {
      await createPendingMatch(supabase, userId, projectType, connectionType, interests[0]);
      return new Response(
        JSON.stringify({ matched: false, message: "Match in progress" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // For each candidate in same college, check seriousness level compatibility
    // Get seriousness scores for candidates (long_term) or use interest level (short_term)
    let compatibleUserId: string | null = null;
    let matchedInterestName: string | null = null;

    for (const candidateInterest of candidateInterests) {
      if (!sameCollegeUserIds.has(candidateInterest.user_id)) continue;

      let candidateLevel: string | null = null;

      if (projectType === "long_term") {
        // Use seriousness_scores
        const { data: score } = await supabase
          .from("seriousness_scores")
          .select("level")
          .eq("user_id", candidateInterest.user_id)
          .eq("interest_name", candidateInterest.interest_name)
          .limit(1)
          .maybeSingle();
        candidateLevel = score?.level ?? null;
      } else {
        // short_term — use interest level
        candidateLevel = candidateInterest.level ?? null;
      }

      if (!candidateLevel) continue;

      // Check level tolerance against any of my levels
      for (const interest of interests) {
        const myLevel = levels[interest];
        if (!myLevel) continue;
        if (levelWithinTolerance(myLevel, candidateLevel)) {
          // Check this candidate doesn't already have an active match with me
          const { data: existingMatch } = await supabase
            .from("matches")
            .select("id")
            .or(`and(user_id.eq.${userId},matched_user_id.eq.${candidateInterest.user_id}),and(user_id.eq.${candidateInterest.user_id},matched_user_id.eq.${userId})`)
            .in("status", ["matched", "active"])
            .limit(1)
            .maybeSingle();

          if (!existingMatch) {
            compatibleUserId = candidateInterest.user_id;
            matchedInterestName = candidateInterest.interest_name;
            break;
          }
        }
      }
      if (compatibleUserId) break;
    }

    if (!compatibleUserId) {
      await createPendingMatch(supabase, userId, projectType, connectionType, interests[0]);
      return new Response(
        JSON.stringify({ matched: false, message: "Match in progress" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- MATCH FOUND ---
    // For short_group: check if there's an existing open group room for this interest/college
    let chatRoomId: string;

    if (connectionType === "short_group") {
      // Look for an existing short_group room with < 4 members that matches
      const { data: existingRooms } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("room_type", "short_group")
        .eq("project_type", projectType)
        .eq("interest_name", matchedInterestName);

      let joinedRoomId: string | null = null;

      for (const room of existingRooms || []) {
        const { count } = await supabase
          .from("chat_room_members")
          .select("id", { count: "exact", head: true })
          .eq("chat_room_id", room.id);

        if ((count ?? 0) < 4) {
          // Add both users to this room
          await supabase.from("chat_room_members").upsert(
            { chat_room_id: room.id, user_id: userId },
            { onConflict: "chat_room_id,user_id" },
          );
          await supabase.from("chat_room_members").upsert(
            { chat_room_id: room.id, user_id: compatibleUserId },
            { onConflict: "chat_room_id,user_id" },
          );
          joinedRoomId = room.id;
          break;
        }
      }

      if (joinedRoomId) {
        chatRoomId = joinedRoomId;
      } else {
        // Create new short_group room
        const { data: newRoom } = await supabase
          .from("chat_rooms")
          .insert({
            room_type: "short_group",
            project_type: projectType,
            interest_name: matchedInterestName!,
            connection_type: "short_group",
          })
          .select()
          .maybeSingle();

        chatRoomId = newRoom!.id;
        await supabase.from("chat_room_members").insert([
          { chat_room_id: chatRoomId, user_id: userId },
          { chat_room_id: chatRoomId, user_id: compatibleUserId },
        ]);
      }
    } else {
      // 1-on-1
      const { data: newRoom } = await supabase
        .from("chat_rooms")
        .insert({
          room_type: "1-on-1",
          project_type: projectType,
          interest_name: matchedInterestName!,
          connection_type: "1-on-1",
        })
        .select()
        .maybeSingle();

      chatRoomId = newRoom!.id;
      await supabase.from("chat_room_members").insert([
        { chat_room_id: chatRoomId, user_id: userId },
        { chat_room_id: chatRoomId, user_id: compatibleUserId },
      ]);
    }

    // Create match record (status active, linked to room)
    await supabase.from("matches").insert({
      user_id: userId,
      matched_user_id: compatibleUserId,
      project_type: projectType,
      connection_type: connectionType,
      status: "active",
      chat_room_id: chatRoomId,
    });

    // Also create a reverse match so the peer sees it
    await supabase.from("matches").insert({
      user_id: compatibleUserId,
      matched_user_id: userId,
      project_type: projectType,
      connection_type: connectionType,
      status: "active",
      chat_room_id: chatRoomId,
    });

    return new Response(
      JSON.stringify({
        matched: true,
        chatRoomId,
        matchedUserId: compatibleUserId,
        interestName: matchedInterestName,
        connectionType,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

async function createPendingMatch(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  projectType: string,
  connectionType: string,
  interestName: string,
) {
  // Check if a pending match already exists for this user
  const { data: existing } = await supabase
    .from("matches")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();

  if (existing) return;

  await supabase.from("matches").insert({
    user_id: userId,
    matched_user_id: null,
    project_type: projectType,
    connection_type: connectionType,
    status: "pending",
    chat_room_id: null,
  });
}
