import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { BulletDraft, Experience, Fact, JobAnalysis } from "../core/types";
import { orderedResumeSections, orderedSkills, parseProfileLinks } from "../core/resume-layout";
import { formatRange } from "../format";

export { orderedSkills };

// Single-column, text-only layout with a standard PDF font: every character is
// selectable, ATS parsers read it top to bottom, and files stay a few KB.

export type ResumeData = {
  profile: { fullName: string; headline: string; contact: string; links: string };
  experiences: Experience[];
  facts: Fact[];
  bullets: BulletDraft[];
  analysis: JobAnalysis;
};

const s = StyleSheet.create({
  page: { paddingVertical: 36, paddingHorizontal: 44, fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.35, color: "#111" },
  name: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  sub: { marginTop: 2, color: "#333" },
  section: { marginTop: 12 },
  heading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    borderBottomWidth: 0.75,
    borderBottomColor: "#999",
    paddingBottom: 2,
    marginBottom: 4,
  },
  entry: { marginTop: 5 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  bold: { fontFamily: "Helvetica-Bold" },
  muted: { color: "#444" },
  bullet: { flexDirection: "row", marginTop: 1.5, paddingLeft: 6 },
  dot: { width: 9 },
  bulletText: { flex: 1 },
  link: { color: "#111", textDecoration: "none" },
});

export function ResumeDocument({ data, educationFirst = false }: { data: ResumeData; educationFirst?: boolean }) {
  // Students often lead with their degree; everything else keeps its order.
  const sections = orderedResumeSections(educationFirst);
  const { profile, experiences, bullets, facts, analysis } = data;
  const skills = orderedSkills(facts, analysis);
  const links = parseProfileLinks(profile.links);

  return (
    <Document
      title={`${profile.fullName || "Resume"}${analysis.role ? ` - ${analysis.role}` : ""}`}
      author={profile.fullName}
      creator="ProofMyCV"
    >
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{profile.fullName || "Your Name"}</Text>
        {profile.headline ? <Text style={s.sub}>{profile.headline}</Text> : null}
        <Text style={s.sub}>
          {profile.contact}
          {links.map((l, i) => (
            <Text key={l}>
              {profile.contact || i > 0 ? "  ·  " : ""}
              <Link src={l.startsWith("http") ? l : `https://${l}`} style={s.link}>
                {l}
              </Link>
            </Text>
          ))}
        </Text>

        {sections.map(({ kind, title }) => {
          const entries = experiences.filter(
            (e) => e.kind === kind && (kind === "education" || bullets.some((b) => b.experienceId === e.id)),
          );
          if (entries.length === 0) return null;
          return (
            <View key={kind} style={s.section}>
              <Text style={s.heading}>{title}</Text>
              {entries.map((e) => (
                <View key={e.id} style={s.entry} wrap={false}>
                  <View style={s.row}>
                    <Text>
                      <Text style={s.bold}>{e.title}</Text>
                      {e.org ? <Text style={s.muted}>{`, ${e.org}`}</Text> : null}
                    </Text>
                    <Text style={s.muted}>{formatRange(e)}</Text>
                  </View>
                  {e.location ? <Text style={s.muted}>{e.location}</Text> : null}
                  {bullets
                    .filter((b) => b.experienceId === e.id)
                    .map((b, i) => (
                      <View key={i} style={s.bullet}>
                        <Text style={s.dot}>•</Text>
                        <Text style={s.bulletText}>{b.text}</Text>
                      </View>
                    ))}
                </View>
              ))}
            </View>
          );
        })}

        {skills.length > 0 ? (
          <View style={s.section}>
            <Text style={s.heading}>Skills</Text>
            <Text>{skills.join(", ")}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
