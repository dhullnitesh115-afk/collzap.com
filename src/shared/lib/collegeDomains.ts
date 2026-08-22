/**
 * College Email Domain Mapping
 * ----------------------------
 * Maps common Indian college email domains to human-readable college names.
 * When a user signs up with email OTP, their college name is auto-derived
 * from the email domain and is not editable (per the CollZap spec).
 *
 * If the domain is not in the lookup table, the domain itself is used as
 * a fallback (e.g., "somecollege.ac.in" → "Somecollege").
 */

/** Common Indian college email domains → college name. */
const DOMAIN_TO_COLLEGE: Record<string, string> = {
  // IITs
  'iitb.ac.in': 'IIT Bombay',
  'iitd.ac.in': 'IIT Delhi',
  'iitm.ac.in': 'IIT Madras',
  'iitk.ac.in': 'IIT Kanpur',
  'iitkgp.ac.in': 'IIT Kharagpur',
  'iitr.ac.in': 'IIT Roorkee',
  'iitg.ac.in': 'IIT Guwahati',
  'iith.ac.in': 'IIT Hyderabad',
  'iitbhb.ac.in': 'IIT BHU',
  'iiti.ac.in': 'IIT Indore',
  'iitmandi.ac.in': 'IIT Mandi',
  'iitpkd.ac.in': 'IIT Palakkad',
  'iittp.ac.in': 'IIT Tirupati',
  'iitbhilai.ac.in': 'IIT Bhilai',
  'iitjammu.ac.in': 'IIT Jammu',
  'iitdhn.ac.in': 'IIT Dhanbad',
  'iism.ac.in': 'IIT ISM Dhanbad',
  // NITs
  'nitc.ac.in': 'NIT Calicut',
  'nitw.ac.in': 'NIT Warangal',
  'nittrichy.ac.in': 'NIT Trichy',
  'nitt.edu': 'NIT Trichy',
  'nitkkr.ac.in': 'NIT Kurukshetra',
  'mnit.ac.in': 'MNIT Jaipur',
  'manit.ac.in': 'MANIT Bhopal',
  'nitrr.ac.in': 'NIT Raipur',
  'nitj.ac.in': 'NIT Jalandhar',
  'nitdgp.ac.in': 'NIT Durgapur',
  'nitgoa.ac.in': 'NIT Goa',
  'nitpy.ac.in': 'NIT Puducherry',
  'nits.ac.in': 'NIT Silchar',
  'nita.ac.in': 'NIT Agartala',
  'nitmz.ac.in': 'NIT Mizoram',
  'nitmanipur.ac.in': 'NIT Manipur',
  'nitsri.ac.in': 'NIT Srinagar',
  'nith.ac.in': 'NIT Hamirpur',
  // IIITs
  'iiit.ac.in': 'IIIT Hyderabad',
  'iiitd.ac.in': 'IIIT Delhi',
  'iiitb.ac.in': 'IIIT Bangalore',
  'iiitm.ac.in': 'IIITM Gwalior',
  'iiitdm.ac.in': 'IIITDM Jabalpur',
  'iiitk.ac.in': 'IIIT Kota',
  'iiitl.ac.in': 'IIIT Lucknow',
  'iiits.in': 'IIIT Sri City',
  'iiitvadodara.ac.in': 'IIIT Vadodara',
  'iiitbhopal.ac.in': 'IIIT Bhopal',
  'iiituna.ac.in': 'IIIT Una',
  // BITS
  'bits-pilani.ac.in': 'BITS Pilani',
  'hyderabad.bits-pilani.ac.in': 'BITS Hyderabad',
  'goa.bits-pilani.ac.in': 'BITS Goa',
  // Other major universities
  'dtu.ac.in': 'Delhi Technological University',
  'nsut.ac.in': 'NSUT Delhi',
  'igdtuw.ac.in': 'IGDTUW Delhi',
  'ipu.ac.in': 'GGSIPU',
  'du.ac.in': 'Delhi University',
  'jnu.ac.in': 'JNU',
  'bhu.ac.in': 'BHU',
  'amu.ac.in': 'AMU',
  'jamia.ac.in': 'Jamia Millia Islamia',
  'pes.edu': 'PES University',
  'vit.ac.in': 'VIT Vellore',
  'manipal.edu': 'Manipal University',
  'srmist.edu.in': 'SRM Institute',
  'amrita.edu': 'Amrita University',
  'thapar.edu': 'Thapar University',
  'bmsce.ac.in': 'BMS College of Engineering',
  'rvce.edu.in': 'RV College of Engineering',
  'msrit.edu': 'MS Ramaiah Institute',
  'pesit.edu': 'PESIT Bangalore',
  'nitte.edu.in': 'Nitte University',
  'bmsece.edu.in': 'BMS Engineering College',
  'cmr.edu.in': 'CMR University',
  'msruas.ac.in': 'MS Ramaiah University',
  'christuniversity.in': 'Christ University',
  'mountcarmelcollege.edu.in': 'Mount Carmel College',
  'jainuniversity.ac.in': 'Jain University',
  'alliance.edu.in': 'Alliance University',
  'upes.ac.in': 'UPES Dehradun',
  'lpu.co.in': 'Lovely Professional University',
  'chitkara.edu.in': 'Chitkara University',
  'cuchd.in': 'Chandigarh University',
  'amity.edu': 'Amity University',
  'sharda.ac.in': 'Sharda University',
  'galgotiasuniversity.edu.in': 'Galgotias University',
  'nirmauni.ac.in': 'Nirma University',
  'ddn.upes.ac.in': 'UPES Dehradun',
  'iiml.ac.in': 'IIM Lucknow',
  'iima.ac.in': 'IIM Ahmedabad',
  'iimb.ac.in': 'IIM Bangalore',
  'iimc.ac.in': 'IIM Calcutta',
  'iimk.ac.in': 'IIM Kozhikode',
  'iimshillong.ac.in': 'IIM Shillong',
  'iimr.ac.in': 'IIM Ranchi',
  'iimrohtak.ac.in': 'IIM Rohtak',
  'iimraipur.ac.in': 'IIM Raipur',
  'iimtrichy.ac.in': 'IIM Trichy',
  'iimkashipur.ac.in': 'IIM Kashipur',
  'iimu.ac.in': 'IIM Udaipur',
  'iimbg.ac.in': 'IIM Bodh Gaya',
  'iimsambalpur.ac.in': 'IIM Sambalpur',
  'iimjammu.ac.in': 'IIM Jammu',
  'iimsirmaur.ac.in': 'IIM Sirmaur',
  'iimv.ac.in': 'IIM Visakhapatnam',
  'iimnagpur.ac.in': 'IIM Nagpur',
  'iimamritsar.ac.in': 'IIM Amritsar',
  'iimbodhgaya.ac.in': 'IIM Bodh Gaya',
  // ISB
  'isb.edu': 'ISB',
  // IISc
  'iisc.ac.in': 'IISc Bangalore',
  // IIFT
  'iift.ac.in': 'IIFT',
  // ICSI
  'icsi.edu': 'ICSI',
  // ICAI
  'icai.org': 'ICAI',
  // SPA
  'spa.ac.in': 'School of Planning and Architecture',
  // NIFT
  'nift.ac.in': 'NIFT',
  // NID
  'nid.edu': 'NID',
  // NLU
  'nludelhi.ac.in': 'NLU Delhi',
  'nls.ac.in': 'NLSIU Bangalore',
  'nalsar.ac.in': 'NALSAR Hyderabad',
  // AIIMS
  'aiims.edu': 'AIIMS',
  'aiimsexams.org': 'AIIMS',
  // JEE/Engineering colleges
  'coep.ac.in': 'COEP Pune',
  'vgec.ac.in': 'VGEC Ahmedabad',
  'ldce.ac.in': 'LD College of Engineering',
  'geca.ac.in': 'GEC Aurangabad',
  'spce.ac.in': 'SPCE Mumbai',
  'djsce.ac.in': 'DJSCE Mumbai',
  'rait.ac.in': 'RAIT Mumbai',
  'pccoe.ac.in': 'PCCOE Pune',
  'cumminscollege.org': 'Cummins College Pune',
  'viit.ac.in': 'VIIT Pune',
  'sitpune.edu.in': 'SIT Pune',
  'mitwpu.edu.in': 'MIT WPU',
  'mitpune.edu.in': 'MIT Pune',
  'moderncoe.edu.in': 'Modern COE Pune',
  'sardarpatelcollege.edu.in': 'Sardar Patel College',
  'sfitengg.org': 'SFIT Mumbai',
  'djsce.org': 'DJSCE',
  'sies.edu.in': 'SIES',
  'kjsce.edu.in': 'KJSCE Mumbai',
  'scesoma.org': 'SCES Mumbai',
  'pccoe.edu': 'PCCOE',
  'tcsc.edu.in': 'Thakur College',
  'kcce.edu.in': 'KCC Engineering',
  'acesasi.ac.in': 'ACES',
  'aeg.edu.in': 'AEG',
  'nmims.edu': 'NMIMS',
  'krea.edu.in': 'Krea University',
  'flame.edu.in': 'FLAME University',
  'ashoka.edu.in': 'Ashoka University',
  'plaksha.org': 'Plaksha University',
};

/**
 * Derive a college name from an email address's domain.
 * @param email - The user's email address (e.g., "student@iitd.ac.in")
 * @returns The college name, or a title-cased version of the domain if unknown.
 */
export function getCollegeFromEmail(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) return '';

  // Direct lookup
  if (DOMAIN_TO_COLLEGE[domain]) {
    return DOMAIN_TO_COLLEGE[domain];
  }

  // Try removing subdomains (e.g., "mail.iitd.ac.in" → "iitd.ac.in")
  const parts = domain.split('.');
  for (let i = 0; i < parts.length - 1; i++) {
    const subDomain = parts.slice(i).join('.');
    if (DOMAIN_TO_COLLEGE[subDomain]) {
      return DOMAIN_TO_COLLEGE[subDomain];
    }
  }

  // Fallback: title-case the domain (e.g., "somecollege.ac.in" → "Somecollege")
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
}
