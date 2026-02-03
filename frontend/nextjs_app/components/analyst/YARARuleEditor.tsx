'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { X, Play, FileText, CheckCircle, AlertTriangle, Code, TestTube } from 'lucide-react';
import { useAuditLog } from '@/hooks/useAuditLog';

interface YARARuleEditorProps {
  ruleName: string;
  onClose: () => void;
  userId: string;
}

interface TestResult {
  file: string;
  matched: boolean;
  confidence: number;
  details?: string;
}

export const YARARuleEditor = ({ ruleName, onClose, userId }: YARARuleEditorProps) => {
  const [ruleContent, setRuleContent] = useState(`rule ${ruleName} {
    meta:
        description = "Detects Ryuk ransomware network beacon"
        author = "OCH Security Team"
        date = "2024-01-15"

    strings:
        $user_agent = "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko"
        $c2_domain = "ryuk.example.com"
        $encryption_marker = { 52 79 55 4b } // RYUK

    condition:
        $user_agent and $c2_domain and $encryption_marker
}`);

  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testTime, setTestTime] = useState<number | null>(null);

  const logAction = useAuditLog(userId);

  // Mock rule testing
  const testRule = async () => {
    setIsTesting(true);
    logAction('yara.rule.test', { ruleName });

    const startTime = Date.now();

    // Mock test results
    const mockResults: TestResult[] = [
      {
        file: 'sample_malware.exe',
        matched: true,
        confidence: 95,
        details: 'All conditions met - high confidence ransomware detection'
      },
      {
        file: 'legitimate_app.exe',
        matched: false,
        confidence: 0,
        details: 'No matching patterns found'
      },
      {
        file: 'suspicious_file.dll',
        matched: true,
        confidence: 78,
        details: 'Partial match - encryption marker detected'
      },
      {
        file: 'system_file.sys',
        matched: false,
        confidence: 0,
        details: 'Clean system file'
      }
    ];

    // Simulate testing delay
    setTimeout(() => {
      setTestResults(mockResults);
      setTestTime(Date.now() - startTime);
      setIsTesting(false);
      logAction('yara.rule.test.complete', {
        ruleName,
        testCount: mockResults.length,
        matches: mockResults.filter(r => r.matched).length,
        executionTime: Date.now() - startTime
      });
    }, 2000);
  };

  const saveRule = () => {
    logAction('yara.rule.save', { ruleName, ruleLength: ruleContent.length });
    // Mock save functionality
    console.log('Rule saved:', ruleName);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-och-midnight-black border border-och-steel-grey/50 rounded-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-och-steel-grey/50 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-och-defender-blue flex items-center gap-2">
              <FileText className="w-6 h-6" />
              YARA Rule Editor
            </h2>
            <p className="text-sm text-och-steel-grey mt-1">
              Live rule testing against sample malware collection
            </p>
          </div>

          <Button
            variant="ghost"
            onClick={onClose}
            className="text-och-steel-grey hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Rule Editor */}
        <div className="flex flex-col lg:flex-row h-[60vh]">
          {/* Editor Panel */}
          <div className="flex-1 p-6 border-r border-och-steel-grey/50 lg:w-1/2">
            <div className="flex items-center gap-3 mb-4">
              <Code className="w-5 h-5 text-och-cyber-mint" />
              <div className="font-medium text-och-cyber-mint">Rule: {ruleName}</div>
              <Badge className="bg-och-defender-blue/20 text-och-defender-blue border-och-defender-blue/30">
                Live Testing
              </Badge>
            </div>

            <textarea
              value={ruleContent}
              onChange={(e) => setRuleContent(e.target.value)}
              className="w-full h-80 bg-och-steel-grey/30 border border-och-steel-grey/50 rounded-lg p-4 font-mono text-sm text-white resize-none focus:border-och-defender-blue focus:outline-none"
              placeholder="Enter YARA rule..."
            />

            <div className="flex gap-3 mt-4">
              <Button
                onClick={testRule}
                disabled={isTesting}
                className="bg-och-defender-blue hover:bg-och-defender-blue/90 flex-1"
              >
                {isTesting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Rule
                  </>
                )}
              </Button>

              <Button
                onClick={saveRule}
                variant="outline"
                className="border-och-steel-grey/50"
              >
                Save Rule
              </Button>
            </div>
          </div>

          {/* Test Results Panel */}
          <div className="flex-1 p-6 lg:w-1/2">
            <div className="flex items-center gap-3 mb-4">
              <TestTube className="w-5 h-5 text-och-sahara-gold" />
              <div className="font-medium text-och-sahara-gold">Test Results</div>

              {testTime && (
                <Badge className="bg-och-cyber-mint/20 text-och-cyber-mint border-och-cyber-mint/30">
                  {testTime}ms
                </Badge>
              )}
            </div>

            {testResults.length === 0 && !isTesting && (
              <div className="text-center py-12 text-och-steel-grey">
                <TestTube className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Run a test to see rule matches against sample files.</p>
                <p className="text-sm mt-2">Test collection includes 500+ malware samples.</p>
              </div>
            )}

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 transition-all ${
                    result.matched
                      ? 'border-och-signal-orange/50 bg-och-signal-orange/10'
                      : 'border-och-cyber-mint/50 bg-och-cyber-mint/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {result.matched ? (
                        <AlertTriangle className="w-4 h-4 text-och-signal-orange" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-och-cyber-mint" />
                      )}
                      <span className="font-mono text-sm font-medium">
                        {result.file}
                      </span>
                    </div>

                    <div className={`text-xs font-bold px-2 py-1 rounded ${
                      result.confidence > 80 ? 'bg-och-signal-orange/20 text-och-signal-orange' :
                      result.confidence > 50 ? 'bg-och-sahara-gold/20 text-och-sahara-gold' :
                      'bg-och-cyber-mint/20 text-och-cyber-mint'
                    }`}>
                      {result.confidence}%
                    </div>
                  </div>

                  <div className="text-sm text-och-steel-grey">
                    {result.details}
                  </div>

                  <div className="mt-2">
                    <Badge
                      className={`text-xs ${
                        result.matched
                          ? 'bg-och-signal-orange/20 text-och-signal-orange border-och-signal-orange/30'
                          : 'bg-och-cyber-mint/20 text-och-cyber-mint border-och-cyber-mint/30'
                      }`}
                    >
                      {result.matched ? 'MALWARE DETECTED' : 'CLEAN'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {testResults.length > 0 && (
              <div className="mt-4 p-3 bg-och-steel-grey/20 rounded-lg">
                <div className="text-sm text-och-steel-grey">
                  <div className="flex justify-between">
                    <span>Total Files:</span>
                    <span className="font-medium">{testResults.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Detections:</span>
                    <span className="font-medium text-och-signal-orange">
                      {testResults.filter(r => r.matched).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>False Positives:</span>
                    <span className="font-medium text-och-cyber-mint">
                      {testResults.filter(r => !r.matched).length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
