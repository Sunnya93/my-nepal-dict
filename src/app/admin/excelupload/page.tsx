'use client';

import { useMemo, useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, Table, ProgressBar, Card } from 'react-bootstrap';
import { createWord } from '@/lib/words';
import AdminGuard from '@/components/AdminGuard';

type ParsedRow = {
  Nepali: string;
  Korean: string;
  English?: string;
  Sound?: string;
  Example?: string;
  DeleteFlag?: string;
};

const HEADER_ALIASES: Record<string, keyof ParsedRow> = {
  nepali: 'Nepali',
  네팔어: 'Nepali',
  korean: 'Korean',
  한국어: 'Korean',
  english: 'English',
  영어: 'English',
  sound: 'Sound',
  발음: 'Sound',
  example: 'Example',
  예문: 'Example',
  deleteflag: 'DeleteFlag',
  삭제: 'DeleteFlag',
};

export default function ExcelUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);

  const canUpload = useMemo(() => rows.length > 0 && !isParsing && !isUploading, [rows, isParsing, isUploading]);

  const parseExcel = async () => {
    if (!file) return;
    setError('');
    setIsParsing(true);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);
      const sheet = workbook.worksheets[0];
      if (!sheet) throw new Error('첫 번째 시트를 찾을 수 없습니다.');

      // Read header row
      const headerRow = sheet.getRow(1);
      const headerMap = new Map<number, keyof ParsedRow>();
      headerRow.eachCell((cell, colNumber) => {
        const raw = String(cell.value || '').toString().trim();
        const key = HEADER_ALIASES[raw.toLowerCase()];
        if (key) headerMap.set(colNumber, key);
      });

      if (!headerMap.size) throw new Error('헤더를 인식하지 못했습니다. (예: Nepali, Korean, Example ...)');

      const parsed: ParsedRow[] = [];
      for (let r = 2; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        const record: Partial<ParsedRow> = {};
        headerMap.forEach((key, col) => {
          const v = row.getCell(col).value;
          if (v == null) {
            (record as any)[key] = '';
            return;
          }
          if (typeof v === 'object' && 'richText' in (v as any)) {
            (record as any)[key] = (v as any).richText.map((t: any) => t.text).join('');
          } else {
            (record as any)[key] = String((v as any).text ?? (v as any).result ?? v).trim();
          }
        });

        if (record.Nepali || record.Korean) {
          parsed.push({
            Nepali: record.Nepali?.trim() || '',
            Korean: record.Korean?.trim() || '',
            English: record.English?.trim() || undefined,
            Sound: record.Sound?.trim() || undefined,
            Example: record.Example?.trim() || undefined,
            DeleteFlag: record.DeleteFlag?.trim() || undefined,
          });
        }
      }

      setRows(parsed);
    } catch (e: any) {
      setError(e?.message || '엑셀 파싱 중 오류가 발생했습니다.');
    } finally {
      setIsParsing(false);
    }
  };

  const uploadToFirestore = async () => {
    setIsUploading(true);
    setUploadedCount(0);
    setError('');
    try {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        await createWord({
          Nepali: row.Nepali || '',
          Korean: row.Korean || '',
          English: row.English || '',
          Sound: row.Sound || '',
          Example: row.Example || '',
          DeleteFlag: row.DeleteFlag || 'N',
        } as any);
        setUploadedCount(i + 1);
      }
    } catch (e: any) {
      setError(e?.message || '업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AdminGuard>
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <Card className="glass-card border-0 rounded-4">
              <Card.Body className="p-4">
                <h4 className="mb-3">엑셀 업로드 (관리자)</h4>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form className="mb-3" onSubmit={(e) => e.preventDefault()}>
                <Form.Group>
                  <Form.Label>엑셀 파일 선택 (.xlsx)</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setFile((e.target as HTMLInputElement).files?.[0] || null)}
                    disabled={isParsing || isUploading}
                  />
                </Form.Group>
              </Form>
              <div className="d-flex gap-2 mb-3">
                <Button onClick={parseExcel} disabled={!file || isParsing || isUploading}>
                  {isParsing ? '파싱 중...' : '파싱하기'}
                </Button>
                <Button variant="success" onClick={uploadToFirestore} disabled={!canUpload}>
                  {isUploading ? '업로드 중...' : 'Firestore 업로드'}
                </Button>
                <Button variant="info" onClick={() => {
                  const url = '/download/sample.xlsx';
                  window.open(url, '_blank');
                }}>
                  샘플 다운로드
                </Button>
              </div>

              {isUploading && (
                <div className="mb-3">
                  <ProgressBar now={(uploadedCount / Math.max(rows.length, 1)) * 100} label={`${uploadedCount}/${rows.length}`} />
                </div>
              )}

              {rows.length > 0 && (
                <>
                  <div className="mb-2 text-muted">총 {rows.length}건 파싱됨 (미리보기 상위 20건)</div>
                  <Table bordered size="sm" responsive>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nepali</th>
                        <th>Korean</th>
                        <th>English</th>
                        <th>Sound</th>
                        <th>Example</th>
                        <th>DeleteFlag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 20).map((r, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{r.Nepali}</td>
                          <td>{r.Korean}</td>
                          <td>{r.English || ''}</td>
                          <td>{r.Sound || ''}</td>
                          <td>{r.Example || ''}</td>
                          <td>{r.DeleteFlag || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </AdminGuard>
  );
}


