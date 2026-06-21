// Frontend-seitige Typen für alle Backend-Endpoints.
//
// Aktuell manuell gepflegt. Bei Schema-Änderungen im Backend müssen wir hier
// nachziehen. Wenn das zu viel wird, ziehen wir später ein Shared-Types-
// Package im Monorepo (oder OpenAPI-Generator) ein. Für jetzt: Disziplin.

// ── Gemeinsame Bausteine ────────────────────────────────────────────────────

export type UUID = string;
export type ISODateTime = string; // z. B. "2026-05-21T14:30:00.000Z"

export type Role = "USER" | "EVENT_ADMIN" | "DEV_ADMIN";
export type Abschluss = "BACHELOR" | "MASTER" | "STAATSEXAMEN" | "PROMOTION" | "SONSTIGES";
export type Sichtbarkeit = "PUBLIC" | "PRIVATE";
export type EinladungsStatus = "PENDING" | "ACCEPTED" | "DECLINED";
export type ChatTyp = "DIRECT" | "GROUP";
export type MessageMediaTyp = "IMAGE" | "VIDEO";
export type LikeKind = "LIKED" | "PASSED";
export type LocationKategorie =
  | "CAFE"
  | "RESTAURANT"
  | "BAR"
  | "UNI"
  | "SPORT"
  | "PARK"
  | "KULTUR"
  | "ENTERTAINMENT"
  | "SONSTIGES";

export type Coordinates = { lat: number; lng: number };

// ── Profile / Me ────────────────────────────────────────────────────────────

// Gemeinsame Sub-Strukturen von Me und Person (gleiches reiches Shape aus
// formatPerson im Backend).
export type UniRef = { id: UUID; name: string; kuerzel: string };
export type StudiengangRef = { id: UUID; name: string; abschluss: Abschluss };
export type ProfilModul = { id: UUID; name: string; ects: number | null; semester: number | null };
export type ProfilHobby = { id: UUID; name: string; icon: string };
export type ProfilFrageAntwort = {
  frageId: UUID;
  text: string;
  antwort: string;
  position: number;
};

export type Me = {
  id: UUID;
  role: Role;
  name: string;
  alter: number | null;
  kurzbeschreibung: string | null;
  bilder: string[];
  studiengangId: UUID | null;
  uniVerified: boolean;
  uni: UniRef | null;
  studiengang: StudiengangRef | null;
  module: ProfilModul[];
  hobbies: ProfilHobby[];
  frageAntworten: ProfilFrageAntwort[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type AuthSyncResponse = { profile: Me };
export type GetMeResponse = { profile: Me };
export type PatchMeResponse = { profile: Me };

// ── Katalog ─────────────────────────────────────────────────────────────────

export type Universitaet = {
  id: UUID;
  name: string;
  kuerzel: string;
  logoUrl: string | null;
  emailDomains: string[];
};

export type Studiengang = {
  id: UUID;
  name: string;
  abschluss: Abschluss;
};

export type ModulShort = {
  id: UUID;
  name: string;
  nummer: string;
  ects: number | null;
  code: string | null;
};

// Bereich-Baum ist seit dem Moses-Import nur noch Curriculum-Gerüst
// (Pflicht/Wahl) ohne Modul-Blätter — die Module hängen flach am Studiengang.
export type Bereich = {
  id: UUID;
  name: string;
  path: string;
  kinder: Bereich[];
};

export type ModulTeilnehmer = {
  id: UUID;
  name: string;
  bild: string | null;
  semester: number | null;
};

// Ein Modul kann zu mehreren Studiengängen gehören (M:N) → studiengaenge[].
export type ModulStudiengang = {
  id: UUID;
  name: string;
  abschluss: Abschluss;
  universitaet: { id: UUID; name: string; kuerzel: string };
};

export type ModulDetail = {
  id: UUID;
  name: string;
  nummer: string;
  ects: number | null;
  code: string | null;
  studiengaenge: ModulStudiengang[];
  anzahlTeilnehmer: number;
  teilnehmer: ModulTeilnehmer[];
};

export type GetUnisResponse = { universitaeten: Universitaet[] };
export type GetStudiengaengeResponse = { studiengaenge: Studiengang[] };
export type GetModuldatenbankResponse = {
  studiengang: {
    id: UUID;
    name: string;
    abschluss: Abschluss;
    universitaet: { id: UUID; name: string; kuerzel: string };
  };
  // Flache Modulliste des Studiengangs (via studiengang_module M:N).
  module: ModulShort[];
  // Curriculum-Gerüst (aktuell ohne Module).
  bereiche: Bereich[];
};
export type GetModulResponse = { modul: ModulDetail };

// ── Personen ────────────────────────────────────────────────────────────────

export type Person = {
  id: UUID;
  role: Role;
  name: string;
  alter: number | null;
  kurzbeschreibung: string | null;
  bilder: string[];
  uniVerified: boolean;
  uni: UniRef | null;
  studiengang: StudiengangRef | null;
  module: ProfilModul[];
  hobbies: ProfilHobby[];
  frageAntworten: ProfilFrageAntwort[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type GetPersonenResponse = { personen: Person[]; nextCursor: UUID | null };
export type GetPersonResponse = { person: Person };

// ── Meine Kurse ─────────────────────────────────────────────────────────────

export type MeinKurs = {
  modulId: UUID;
  name: string;
  nummer: string;
  ects: number | null;
  code: string | null;
  semester: number | null;
  anzahlTeilnehmer: number;
};

export type GetMeKurseResponse = { kurse: MeinKurs[] };
export type PostMeKurseResponse = {
  enrollment: { modulId: UUID; semester: number | null };
};

// ── Aktivitäten ─────────────────────────────────────────────────────────────

export type AktivitaetStatus = "offen" | "voll" | "beendet";

export type AktivitaetMini = {
  id: UUID;
  titel: string;
  bild: string | null;
};

export type AktivitaetAdmin = {
  id: UUID;
  name: string;
  bild: string | null;
};

export type AktivitaetTeilnehmer = {
  id: UUID;
  name: string;
  bild: string | null;
};

export type Aktivitaet = {
  id: UUID;
  titel: string;
  beschreibung: string;
  bilder: string[];
  adresseStrasse: string;
  adressePlzOrt: string;
  ortKurz: string;
  koordinaten: Coordinates;
  startAt: ISODateTime;
  dauerMinuten: number;
  maxPlaetze: number;
  sichtbarkeit: Sichtbarkeit;
  official: boolean;
  beendetAt: ISODateTime | null;
  status: AktivitaetStatus;
  anzahlTeilnehmer: number;
  admin: AktivitaetAdmin;
  teilnehmer: AktivitaetTeilnehmer[];
  modul: { id: UUID; name: string; ects: number | null } | null;
  location: { id: UUID; name: string; kategorie: LocationKategorie } | null;
  chatId: UUID | null;
};

export type GetAktivitaetenResponse = { aktivitaeten: Aktivitaet[]; total?: number };
export type GetAktivitaetResponse = { aktivitaet: Aktivitaet };

export type AktivitaetEinladung = {
  aktivitaetId: UUID;
  profileId: UUID;
  status: EinladungsStatus;
  invitedById: UUID | null;
  createdAt: ISODateTime;
  decidedAt: ISODateTime | null;
};

export type GetMeEinladungenResponse = {
  einladungen: {
    aktivitaet: Aktivitaet;
    invitedBy: { id: UUID; name: string; bild: string | null } | null;
    createdAt: ISODateTime;
  }[];
};

// ── Chats ───────────────────────────────────────────────────────────────────

export type ChatTeilnehmerMini = {
  id: UUID;
  name: string;
  bild: string | null;
};

export type ChatLastMessage = {
  id: UUID;
  senderId: UUID | null;
  text: string | null;
  mediaTyp: MessageMediaTyp | null;
  createdAt: ISODateTime;
};

export type ChatListItem = {
  id: UUID;
  typ: ChatTyp;
  aktivitaet: AktivitaetMini | null;
  teilnehmer: ChatTeilnehmerMini[];
  lastMessage: ChatLastMessage | null;
  lastReadAt: ISODateTime | null;
  stumm: boolean;
  updatedAt: ISODateTime;
};

export type GetMeChatsResponse = { chats: ChatListItem[] };

export type Message = {
  id: UUID;
  senderId: UUID | null;
  sender: { id: UUID; name: string; bild: string | null } | null;
  text: string | null;
  mediaUrl: string | null;
  mediaTyp: MessageMediaTyp | null;
  meetingProposal: MeetingProposal | null;
  createdAt: ISODateTime;
};

export type GetChatMessagesResponse = { messages: Message[]; nextCursor: UUID | null };

export type MeetingProposal = {
  id: UUID;
  messageId: UUID;
  titel: string;
  bilder: string[];
  startAt: ISODateTime;
  status: EinladungsStatus;
  decidedAt: ISODateTime | null;
  locationId: UUID | null;
  aktivitaetId: UUID | null;
  customAdresseStrasse: string | null;
  customAdressePlzOrt: string | null;
  customKoordinatenLat: number | null;
  customKoordinatenLng: number | null;
  createdAt: ISODateTime;
};

export type PostMessageResponse = { message: Message };
export type PostProposalResponse = { message: Message; proposal: MeetingProposal };
export type PatchProposalResponse = { proposal: MeetingProposal };

// ── Matching ────────────────────────────────────────────────────────────────

export type Like = {
  likerId: UUID;
  likedId: UUID;
  kind: LikeKind;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type Match = {
  profile1Id: UUID;
  profile2Id: UUID;
  chatId: UUID;
  createdAt: ISODateTime;
};

export type PostLikeResponse = {
  like: Like;
  match: Match | null;
  chatId: UUID | null;
};

export type MatchListItem = {
  chatId: UUID;
  chatUpdatedAt: ISODateTime;
  other: { id: UUID; name: string; bild: string | null };
  matchedAt: ISODateTime;
};

export type GetMatchesResponse = { matches: MatchListItem[] };
export type GetSwipeQueueResponse = { personen: Person[] };

// ── Storage ─────────────────────────────────────────────────────────────────

export type StorageBucket = "avatars" | "aktivitaet-cover" | "chat-media";

export type GetUploadUrlResponse = {
  bucket: StorageBucket;
  path: string;
  uploadUrl: string;
  token: string;
  publicUrl: string | null;
};

// ── Hobbies / Profil-Fragen (Katalog + Speichern) ────────────────────────────

export type HobbyKatalogEintrag = { id: UUID; name: string; icon: string };
export type GetHobbiesResponse = { hobbies: HobbyKatalogEintrag[] };
export type PutHobbiesResponse = { hobbyIds: UUID[] };

export type ProfilFrageKatalogEintrag = { id: UUID; text: string };
export type GetProfilFragenResponse = { fragen: ProfilFrageKatalogEintrag[] };
export type PutFragenBody = {
  antworten: { frageId: UUID; antwort: string }[];
};
export type PutFragenResponse = {
  antworten: { frageId: UUID; antwort: string; position: number }[];
};
