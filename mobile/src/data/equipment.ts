export type EquipmentCriticality = 'critical' | 'high' | 'medium' | 'low';
export type EquipmentStatus = 'operational' | 'maintenance';

export type Equipment = {
  /** Canonical equipment_id from the local graph seed; use this for lookup/navigation. */
  id: string;
  /** Human-readable asset tag retained from the seeded equipment name. */
  tag: string;
  name: string;
  type: string;
  location: string;
  manufacturer: string;
  model: string;
  installDate: string;
  status: EquipmentStatus;
  criticality: EquipmentCriticality;
  /** Illustrative client-only metric; it is not part of seed.py or an API response. */
  demoHealthScore: number;
  components: string[];
  failureModes: { name: string; severity: EquipmentCriticality }[];
};

/**
 * Local demo records mirror the equipment metadata and component/failure links
 * in `Knowledge Graph Setup/seed.py`. Health scores are presentation-only values.
 */
export const DEMO_EQUIPMENT: Equipment[] = [
  {
    id: 'EQ-001',
    tag: 'P-101',
    name: 'Centrifugal Pump P-101',
    type: 'Pump',
    location: 'Plant A — Floor 1',
    manufacturer: 'FlowTech',
    model: 'CP-3500X',
    installDate: '2020-03-15',
    status: 'operational',
    criticality: 'high',
    demoHealthScore: 78,
    components: ['Mechanical Seal', 'Drive Shaft Bearing', 'Impeller'],
    failureModes: [
      { name: 'Seal Leakage', severity: 'high' },
      { name: 'Bearing Overheating', severity: 'critical' },
    ],
  },
  {
    id: 'EQ-002',
    tag: 'HX-202',
    name: 'Heat Exchanger HX-202',
    type: 'Heat Exchanger',
    location: 'Plant A — Floor 1',
    manufacturer: 'ThermoCore',
    model: 'HX-2000',
    installDate: '2019-07-22',
    status: 'operational',
    criticality: 'medium',
    demoHealthScore: 88,
    components: ['Tube Bundle', 'Shell Gasket'],
    failureModes: [{ name: 'Seal Leakage', severity: 'high' }],
  },
  {
    id: 'EQ-003',
    tag: 'C-305',
    name: 'Compressor C-305',
    type: 'Compressor',
    location: 'Plant A — Floor 2',
    manufacturer: 'AirForce Industrial',
    model: 'RC-750',
    installDate: '2021-01-10',
    status: 'maintenance',
    criticality: 'high',
    demoHealthScore: 52,
    components: ['Inlet Valve', 'Rotor Assembly', 'Piston Ring'],
    failureModes: [{ name: 'Valve Sticking', severity: 'medium' }],
  },
  {
    id: 'EQ-004',
    tag: 'CB-410',
    name: 'Conveyor Belt CB-410',
    type: 'Conveyor',
    location: 'Plant B — Outdoor',
    manufacturer: 'BeltMaster',
    model: 'CB-MAX',
    installDate: '2018-11-03',
    status: 'operational',
    criticality: 'low',
    demoHealthScore: 95,
    components: ['Drive Belt', 'Roller Bearing'],
    failureModes: [
      { name: 'Belt Slippage', severity: 'low' },
      { name: 'Bearing Overheating', severity: 'critical' },
    ],
  },
  {
    id: 'EQ-005',
    tag: 'BLR-501',
    name: 'Boiler BLR-501',
    type: 'Boiler',
    location: 'Plant A — Floor 2',
    manufacturer: 'SteamPro',
    model: 'SB-1200',
    installDate: '2017-06-18',
    status: 'operational',
    criticality: 'critical',
    demoHealthScore: 63,
    components: ['Safety Relief Valve', 'Water Pump'],
    failureModes: [{ name: 'Pressure Buildup', severity: 'critical' }],
  },
];
