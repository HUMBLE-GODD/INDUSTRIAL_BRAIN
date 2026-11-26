import { ApiClient } from '../src/api/client';

describe('Scanner & Manual Equipment Lookup Logic', () => {
  // Reusable parser matching ScanScreen implementation
  function parseScannedData(data: string): string {
    const raw = data.trim();

    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.equipment_id) return String(parsed.equipment_id).toUpperCase();
        if (parsed.id) return String(parsed.id).toUpperCase();
      } catch {
        // Continue with string parsing
      }
    }

    const urlMatch = raw.match(/\/equipment\/([A-Za-z0-9_-]+)/i);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1].toUpperCase();
    }

    return raw.replace(/^(eq:|id:)/i, '').trim().toUpperCase();
  }

  describe('QR Barcode Data Parsing', () => {
    it('parses raw equipment ID string correctly', () => {
      expect(parseScannedData('EQ-001')).toBe('EQ-001');
      expect(parseScannedData('eq-002')).toBe('EQ-002');
      expect(parseScannedData('  EQ-003  ')).toBe('EQ-003');
    });

    it('parses JSON payload containing equipment_id', () => {
      expect(parseScannedData('{"equipment_id": "EQ-001"}')).toBe('EQ-001');
      expect(parseScannedData('{"id": "EQ-005", "plant": "Plant A"}')).toBe('EQ-005');
    });

    it('parses web URL containing equipment path', () => {
      expect(parseScannedData('https://industrialbrain.io/equipment/EQ-001')).toBe('EQ-001');
      expect(parseScannedData('http://192.168.1.50:3000/equipment/EQ-004')).toBe('EQ-004');
    });

    it('parses prefixed equipment string', () => {
      expect(parseScannedData('EQ:EQ-001')).toBe('EQ-001');
      expect(parseScannedData('ID:EQ-003')).toBe('EQ-003');
    });
  });

  describe('Manual Equipment Lookup & Retrieval', () => {
    it('resolves EQ-001 and loads correct asset specification', async () => {
      const parsedId = parseScannedData('EQ-001');
      const detail = await ApiClient.getEquipmentDetail(parsedId);

      expect(detail).toBeDefined();
      expect(detail.id).toBe('EQ-001');
      expect(detail.name).toBe('Centrifugal Pump P-101');
      expect(detail.type).toBe('Pump');
    });

    it('resolves alternative/legacy asset ID P-101 to EQ-001 pump', async () => {
      const detail = await ApiClient.getEquipmentDetail('P-101');

      expect(detail).toBeDefined();
      expect(detail.id).toBe('EQ-001');
      expect(detail.name).toBe('Centrifugal Pump P-101');
    });

    it('resolves all 5 equipment IDs independently without cross-talk', async () => {
      const ids = ['EQ-001', 'EQ-002', 'EQ-003', 'EQ-004', 'EQ-005'];

      for (const id of ids) {
        const detail = await ApiClient.getEquipmentDetail(id);
        expect(detail.id).toBe(id);
      }
    });
  });
});
