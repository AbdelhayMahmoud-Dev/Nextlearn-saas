import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatDate } from '@/lib/utils';

export interface CertificateTemplateProps {
  studentName: string;
  courseTitle: string;
  issuedAt: string;
  certificateNumber: string;
  qrDataUrl?: string;
}

const styles = StyleSheet.create({
  page: { padding: 28, backgroundColor: '#ffffff' },
  border: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 8,
    padding: 36,
    justifyContent: 'space-between',
  },
  brand: { fontSize: 16, color: '#6366f1', fontWeight: 700 },
  heading: { fontSize: 30, marginTop: 24, color: '#1a1a2e', fontWeight: 700 },
  sub: { fontSize: 12, color: '#6b7280', marginTop: 8 },
  name: { fontSize: 40, marginTop: 18, color: '#111827' },
  course: { fontSize: 18, marginTop: 12, color: '#374151' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  meta: { fontSize: 10, color: '#6b7280' },
  sigLine: { width: 160, borderTopWidth: 1, borderColor: '#9ca3af', paddingTop: 4, fontSize: 10, color: '#374151' },
  qr: { width: 72, height: 72 },
});

/** Printable certificate of completion (@react-pdf/renderer). */
export function CertificateTemplate({
  studentName,
  courseTitle,
  issuedAt,
  certificateNumber,
  qrDataUrl,
}: CertificateTemplateProps): JSX.Element {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          <View>
            <Text style={styles.brand}>NextLearn</Text>
            <Text style={styles.heading}>Certificate of Completion</Text>
            <Text style={styles.sub}>This certifies that</Text>
            <Text style={styles.name}>{studentName}</Text>
            <Text style={styles.course}>has successfully completed “{courseTitle}”.</Text>
          </View>

          <View style={styles.footerRow}>
            <View>
              <Text style={styles.sigLine}>Instructor signature</Text>
              <Text style={[styles.meta, { marginTop: 12 }]}>
                Issued {formatDate(issuedAt)}
              </Text>
              <Text style={styles.meta}>Certificate No. {certificateNumber}</Text>
            </View>
            {/* @react-pdf/renderer's <Image> renders into a PDF, not the DOM — it has no `alt` prop. */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {qrDataUrl ? <Image src={qrDataUrl} style={styles.qr} /> : <View style={styles.qr} />}
          </View>
        </View>
      </Page>
    </Document>
  );
}
