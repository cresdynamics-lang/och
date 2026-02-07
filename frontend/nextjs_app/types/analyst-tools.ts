/**
 * Advanced Triage Tools Types
 * For Wireshark/YARA/Sigma tools
 */

export type ToolType = 'wireshark' | 'yara' | 'sigma';

export interface ToolAnalysisRequest {
  tool: ToolType;
  payload: {
    // Wireshark
    pcapFile?: string;
    filter?: string;
    packets?: number;
    // YARA
    rule?: string;
    testData?: string;
    ruleName?: string;
    // Sigma
    ioc?: string;
    searchQuery?: string;
  };
}

export interface ToolAnalysisResponse {
  results: Array<{
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    ioc?: string;
    timestamp?: string;
    metadata?: Record<string, any>;
  }>;
  mttrUpdate: string; // "18min"
  metadata?: {
    packetsAnalyzed?: number;
    rulesMatched?: number;
    sigmaHits?: number;
    executionTime?: number;
  };
}

export interface WiresharkPacket {
  id: string;
  number: number;
  timestamp: string;
  source: string;
  destination: string;
  protocol: string;
  length: number;
  info: string;
  iocDetected?: boolean;
  iocType?: string;
}

export interface YARARule {
  id: string;
  name: string;
  rule: string;
  description?: string;
  author?: string;
  tags?: string[];
}

export interface YARAMatch {
  ruleId: string;
  ruleName: string;
  matches: Array<{
    file: string;
    offset: string;
    data: string;
  }>;
}

export interface SigmaHit {
  id: string;
  ruleId: string;
  ruleName: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ioc: string;
  matchedFields: string[];
}

