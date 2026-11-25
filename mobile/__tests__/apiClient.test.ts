import { ApiClient, ApiError, AuthExpiredError, NotFoundError } from '../src/api/client';
import { TokenStorage } from '../src/api/storage';
import { config } from '../src/api/config';
import { CreateObservationRequest, QueryRequest } from '../src/api/types';

describe('ApiClient - Contracts & Workflows', () => {
  beforeEach(async () => {
    config.setOfflineMode(false);
    config.setCustomBaseUrl(null);
    await TokenStorage.clearAll();
  });

  describe('Tatvik Auth Contract', () => {
    it('authenticates field technician and stores token securely', async () => {
      const response = await ApiClient.login({
        email: 'surbhi.field@industrialbrain.io',
        password: 'techdemo123',
      });

      expect(response).toBeDefined();
      expect(response.access_token).toBeDefined();
      expect(response.token_type.toLowerCase()).toBe('bearer');
      expect(response.user.email).toBe('surbhi.field@industrialbrain.io');
      expect(response.user.role).toBe('technician');

      // Verify token persisted in TokenStorage
      const storedToken = await TokenStorage.getToken();
      expect(storedToken).toBe(response.access_token);

      const storedUser = await TokenStorage.getUser();
      expect(storedUser?.id).toBe(response.user.id);
    });

    it('clears token on logout', async () => {
      await ApiClient.login({
        email: 'surbhi.field@industrialbrain.io',
        password: 'techdemo123',
      });

      await ApiClient.logout();
      expect(await TokenStorage.getToken()).toBeNull();
      expect(await TokenStorage.getUser()).toBeNull();
    });

    it('notifies listeners when a 401 unauthorized / expired session occurs', () => {
      const expiredListener = jest.fn();
      const unsubscribe = ApiClient.onAuthExpired(expiredListener);

      ApiClient.notifyAuthExpired();
      expect(expiredListener).toHaveBeenCalledTimes(1);

      unsubscribe();
      ApiClient.notifyAuthExpired();
      expect(expiredListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tatvik Equipment Contract', () => {
    it('retrieves equipment summary catalog with all 5 canonical assets', async () => {
      const equipmentList = await ApiClient.getEquipmentList();

      expect(Array.isArray(equipmentList)).toBe(true);
      expect(equipmentList.length).toBe(5);

      const ids = equipmentList.map((e) => e.id);
      expect(ids).toContain('EQ-001');
      expect(ids).toContain('EQ-002');
      expect(ids).toContain('EQ-003');
      expect(ids).toContain('EQ-004');
      expect(ids).toContain('EQ-005');
    });

    it('retrieves detailed telemetry, risks, and history for EQ-001 without hardcoded fallback values', async () => {
      const detail = await ApiClient.getEquipmentDetail('EQ-001');

      expect(detail.id).toBe('EQ-001');
      expect(detail.name).toBe('Centrifugal Pump P-101');
      expect(detail.type).toBe('Pump');
      expect(detail.status).toBe('operational');
      expect(detail.criticality).toBe('high');
      expect(detail.health_score).toBe(42);
      expect(detail.rul_cycles).toBe(18);

      // Verify sensor telemetry metrics
      expect(detail.metrics.length).toBeGreaterThan(0);
      expect(detail.metrics[0].sensor_data.vibration_mm_s).toBeCloseTo(4.82, 1);
      expect(detail.metrics[0].anomaly_score).toBe(0.72);

      // Verify linked supplier risks
      expect(detail.linked_risks.length).toBeGreaterThan(0);
      const betaBearingsRisk = detail.linked_risks.find((r) => r.supplier === 'BetaBearings Inc');
      expect(betaBearingsRisk).toBeDefined();
      expect(betaBearingsRisk?.severity).toBe('critical');
      expect(betaBearingsRisk?.failure_mode).toContain('Bearing Overheating');

      // Verify compliance summary
      expect(detail.compliance_summary).toBeDefined();
      expect(detail.compliance_summary.compliant).toBe(true);
      expect(detail.compliance_summary.regulations.length).toBeGreaterThan(0);

      // Verify maintenance history
      expect(detail.maintenance_history.length).toBeGreaterThan(0);
      expect(detail.maintenance_history[0].equipment_id).toBe('EQ-001');
    });

    it('retrieves distinct equipment details for EQ-002 (does not show EQ-001 pump values)', async () => {
      const detail = await ApiClient.getEquipmentDetail('EQ-002');

      expect(detail.id).toBe('EQ-002');
      expect(detail.name).toBe('Heat Exchanger HX-202');
      expect(detail.type).toBe('Heat Exchanger');
      expect(detail.health_score).toBe(79);

      // Verify supplier risk is EpsilonValves Ltd, not BetaBearings
      const epsilonRisk = detail.linked_risks.find((r) => r.supplier === 'EpsilonValves Ltd');
      expect(epsilonRisk).toBeDefined();
      expect(epsilonRisk?.rating).toBe(2.9);
    });

    it('throws NotFoundError for unknown equipment ID', async () => {
      await expect(ApiClient.getEquipmentDetail('UNKNOWN-999')).rejects.toThrow(NotFoundError);
    });

    it('fetches maintenance history list for EQ-001', async () => {
      const history = await ApiClient.getEquipmentHistory('EQ-001');
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].equipment_id).toBe('EQ-001');
    });
  });

  describe('Tatvik Field Observation Contract', () => {
    it('submits a valid observation and receives a stable ID and status (without creating work order)', async () => {
      const request: CreateObservationRequest = {
        equipment_id: 'EQ-001',
        category: 'vibration',
        severity: 'high',
        note: 'Elevated casing vibration detected at 3500 RPM full load test.',
      };

      const response = await ApiClient.createObservation(request);

      expect(response).toBeDefined();
      expect(response.id).toMatch(/^OBS-\d{4}-\d+/);
      expect(response.equipment_id).toBe('EQ-001');
      expect(response.category).toBe('vibration');
      expect(response.severity).toBe('high');
      expect(response.status).toBe('recorded');
      expect(response.created_at).toBeDefined();

      // Verify observation appears in equipment observation query
      const allObservations = await ApiClient.getObservations('EQ-001');
      const found = allObservations.find((o) => o.id === response.id);
      expect(found).toBeDefined();
      expect(found?.note).toBe(request.note);
    });

    it('rejects observation submission if equipment_id is missing', async () => {
      const invalidRequest: any = {
        equipment_id: '',
        category: 'leak',
        severity: 'medium',
        note: 'Valid description here',
      };

      await expect(ApiClient.createObservation(invalidRequest)).rejects.toThrow(
        'equipment_id is required'
      );
    });

    it('rejects observation submission if note is too short (< 5 characters)', async () => {
      const invalidRequest: CreateObservationRequest = {
        equipment_id: 'EQ-001',
        category: 'thermal',
        severity: 'critical',
        note: 'hot',
      };

      await expect(ApiClient.createObservation(invalidRequest)).rejects.toThrow(
        'note must contain at least 5 characters'
      );
    });
  });

  describe('Prathmesh Decision Query Contract', () => {
    it('executes decision query and returns citations, graph evidence, and source mode', async () => {
      const queryReq: QueryRequest = {
        question:
          'Which supplier provides components linked to high or critical failure risks across several assets, and what evidence supports that?',
        top_k: 5,
        include_graph_evidence: true,
      };

      const response = await ApiClient.query(queryReq);

      expect(response).toBeDefined();
      expect(response.answer).toBeDefined();
      expect(response.source_mode).toBe('deterministic');

      // Verify citations
      expect(Array.isArray(response.citations)).toBe(true);
      expect(response.citations.length).toBeGreaterThan(0);
      expect(response.citations[0].document_id).toBeDefined();
      expect(response.citations[0].excerpt).toBeDefined();

      // Verify graph relationship evidence
      expect(Array.isArray(response.graph_evidence)).toBe(true);
      expect(response.graph_evidence.length).toBeGreaterThan(0);
      const suppliers = response.graph_evidence.map((g) => g.supplier);
      expect(suppliers).toContain('BetaBearings Inc');

      // Verify actionable recommendations
      expect(response.recommendations.length).toBeGreaterThan(0);
    });

    it('rejects empty or very short query (< 3 characters)', async () => {
      await expect(ApiClient.query({ question: 'hi' })).rejects.toThrow(
        'question must contain at least 3 characters'
      );
    });

    it('answers equipment specific query with grounded asset telemetry', async () => {
      const response = await ApiClient.query({
        question: 'What is the condition of EQ-001?',
      });

      expect(response.answer).toContain('EQ-001');
      expect(response.answer).toContain('Centrifugal Pump P-101');
      expect(response.source_mode).toBe('deterministic');
    });
  });

  describe('Offline & Failure Handling', () => {
    it('handles offline mode toggle and serves cached/fixture equipment data', async () => {
      config.setOfflineMode(true);
      expect(config.isOfflineMode()).toBe(true);

      const equipment = await ApiClient.getEquipmentList();
      expect(equipment.length).toBe(5);

      const detail = await ApiClient.getEquipmentDetail('EQ-001');
      expect(detail.id).toBe('EQ-001');

      config.setOfflineMode(false);
    });
  });
});
