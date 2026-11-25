import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card } from '../../components/ui/Card';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { ApiClient } from '../../api/client';
import { Citation, GraphEvidence, QueryResponse } from '../../api/types';

type RouteParams = {
  Query: { initialQuestion?: string };
};

type ChatMessage = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  response?: QueryResponse;
  error?: string;
  canRetry?: boolean;
};

const SUGGESTED_QUESTIONS = [
  'Which supplier provides components linked to high or critical failure risks across several assets, and what evidence supports that?',
  'What are the failure risks and component issues for EQ-001 (Centrifugal Pump P-101)?',
  'What is the operating condition and remaining useful life of Boiler BLR-501 (EQ-005)?',
];

export default function QueryScreen() {
  const route = useRoute<RouteProp<RouteParams, 'Query'>>();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello, Technician! I am Industrial Brain AI. Ask questions about equipment condition, supplier risk evidence, failure modes, or maintenance history.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuestion, setLastQuestion] = useState<string>('');

  // Handle incoming initialQuestion from other screens (e.g. EquipmentDetail)
  useEffect(() => {
    if (route.params?.initialQuestion) {
      handleSend(route.params.initialQuestion);
    }
  }, [route.params?.initialQuestion]);

  const handleSend = async (questionText?: string) => {
    const queryStr = (questionText || inputText).trim();
    if (!queryStr || isLoading) return;

    setLastQuestion(queryStr);
    setInputText('');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryStr,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await ApiClient.query({
        question: queryStr,
        top_k: 5,
        include_graph_evidence: true,
      });

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        response,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text:
          err.message ||
          'Decision service is currently unavailable. Check backend connection or retry.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        error: err.message || 'Service Unavailable',
        canRetry: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastQuestion) {
      handleSend(lastQuestion);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';

    if (isUser) {
      return (
        <View style={styles.userBubbleWrapper}>
          <View style={styles.userBubble}>
            <Text style={styles.userMessageText}>{item.text}</Text>
            <Text style={styles.userTimestamp}>{item.timestamp}</Text>
          </View>
        </View>
      );
    }

    // AI Message
    const res = item.response;

    return (
      <View style={styles.aiMessageWrapper}>
        <Card style={[styles.aiCard, !!item.error && styles.aiCardError]}>
          {/* AI Header with Mode Badge */}
          <View style={styles.aiCardHeader}>
            <Text style={styles.aiLabel}>⚡ INDUSTRIAL DECISION ENGINE</Text>
            {res && (
              <View
                style={[
                  styles.modeBadge,
                  res.source_mode === 'deterministic'
                    ? styles.modeBadgeDeterministic
                    : styles.modeBadgeLlm,
                ]}
              >
                <Text
                  style={[
                    styles.modeBadgeText,
                    res.source_mode === 'deterministic'
                      ? styles.modeBadgeTextDeterministic
                      : styles.modeBadgeTextLlm,
                  ]}
                >
                  MODE: {res.source_mode.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Answer Body or Error */}
          {item.error ? (
            <View style={styles.errorSection}>
              <Text style={styles.errorTitle}>⚠️ Decision Service Unavailable</Text>
              <Text style={styles.errorDescription}>{item.text}</Text>
              {item.canRetry && (
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={handleRetry}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryBtnText}>Retry Query</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={styles.aiAnswerText}>{item.text}</Text>
          )}

          {/* Retrieved Facts */}
          {res?.retrieved_facts && res.retrieved_facts.length > 0 && (
            <View style={styles.subSection}>
              <Text style={styles.subSectionTitle}>RETRIEVED FACTUAL FINDINGS</Text>
              {res.retrieved_facts.map((fact, idx) => (
                <Text key={idx} style={styles.factBullet}>
                  • {fact}
                </Text>
              ))}
            </View>
          )}

          {/* Verified Document Citations */}
          {res?.citations && res.citations.length > 0 && (
            <View style={styles.subSection}>
              <Text style={styles.subSectionTitle}>
                SOURCE CITATIONS ({res.citations.length})
              </Text>
              {res.citations.map((cite: Citation, idx: number) => (
                <View key={idx} style={styles.citationBox}>
                  <View style={styles.citationHeader}>
                    <Text style={styles.citationTitle} numberOfLines={1}>
                      📄 {cite.title}
                    </Text>
                    {cite.page && <Text style={styles.citationPage}>{cite.page}</Text>}
                  </View>
                  <Text style={styles.citationExcerpt}>"{cite.excerpt}"</Text>
                  <Text style={styles.citationMeta}>
                    Doc ID: {cite.document_id} • Chunk: {cite.chunk_id}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Knowledge Graph Evidence */}
          {res?.graph_evidence && res.graph_evidence.length > 0 && (
            <View style={styles.subSection}>
              <Text style={styles.subSectionTitle}>
                KNOWLEDGE GRAPH RELATIONSHIP PATHS
              </Text>
              {res.graph_evidence.map((evidence: GraphEvidence, idx: number) => (
                <View key={idx} style={styles.graphBox}>
                  <Text style={styles.graphSupplier}>
                    Supplier: {evidence.supplier}{' '}
                    {evidence.rating !== undefined && `(Rating: ${evidence.rating}/5)`}
                  </Text>
                  <Text style={styles.graphPath}>{evidence.relationship_path}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Actionable Recommendations */}
          {res?.recommendations && res.recommendations.length > 0 && (
            <View style={styles.subSection}>
              <Text style={styles.subSectionTitle}>ACTIONABLE RECOMMENDATIONS</Text>
              {res.recommendations.map((rec: string, idx: number) => (
                <Text key={idx} style={styles.recommendationBullet}>
                  ✓ {rec}
                </Text>
              ))}
            </View>
          )}

          {/* Footer with Timestamp and Processing Duration */}
          <View style={styles.aiFooter}>
            {res?.processing_time_ms !== undefined && (
              <Text style={styles.aiMeta}>
                Processed in {res.processing_time_ms.toFixed(1)}ms
              </Text>
            )}
            <Text style={styles.aiMeta}>{item.timestamp}</Text>
          </View>
        </Card>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OfflineBanner onRetry={handleRetry} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Screen Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Industrial Brain AI</Text>
          <Text style={styles.subtitle}>
            GraphRAG decision engine • Vector search & Knowledge Graph
          </Text>
        </View>

        {/* Message Stream */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            messages.length <= 1 ? (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>
                  Suggested Industrial Questions:
                </Text>
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionChip}
                    onPress={() => handleSend(q)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null
          }
        />

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingBar}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>
              Retrieving document vectors & traversing Neo4j knowledge graph...
            </Text>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask about equipment, suppliers, failure risks..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 2,
  },
  messageList: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  userBubbleWrapper: {
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  userBubble: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderBottomRightRadius: 4,
    maxWidth: '85%',
  },
  userMessageText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '500',
  },
  userTimestamp: {
    ...typography.caption,
    color: 'rgba(0,0,0,0.6)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  aiMessageWrapper: {
    marginBottom: spacing.lg,
  },
  aiCard: {
    padding: spacing.lg,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiCardError: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  aiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  aiLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  modeBadgeDeterministic: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  modeBadgeLlm: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: '#a855f7',
  },
  modeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  modeBadgeTextDeterministic: {
    color: colors.primary,
  },
  modeBadgeTextLlm: {
    color: '#c084fc',
  },
  aiAnswerText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  subSection: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  subSectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  factBullet: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  citationBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    marginBottom: spacing.sm,
  },
  citationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  citationTitle: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.xs,
  },
  citationPage: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  citationExcerpt: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
    marginBottom: 4,
  },
  citationMeta: {
    fontSize: 9,
    color: colors.textMuted,
  },
  graphBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.xs,
  },
  graphSupplier: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  graphPath: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: colors.textMuted,
  },
  recommendationBullet: {
    ...typography.bodySmall,
    color: colors.success,
    marginBottom: 4,
    lineHeight: 18,
  },
  aiFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  aiMeta: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  errorSection: {
    paddingVertical: spacing.md,
  },
  errorTitle: {
    ...typography.bodySmall,
    color: colors.danger,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  errorDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  retryBtnText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  suggestionsContainer: {
    marginTop: spacing.md,
  },
  suggestionsTitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  suggestionChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  suggestionText: {
    ...typography.bodySmall,
    color: colors.primary,
    lineHeight: 18,
  },
  loadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
    color: colors.primary,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    ...typography.bodySmall,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    fontSize: 18,
    color: colors.background,
  },
});
