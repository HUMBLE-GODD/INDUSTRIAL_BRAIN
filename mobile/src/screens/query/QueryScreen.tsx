import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { DataModeNotice } from '../../components/ui/DataModeNotice';
import { API_IS_CONFIGURED, ApiError, aiApi } from '../../lib/api/client';
import type { AiCitation } from '../../lib/api/types';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
  sourceMode?: string;
  citations?: AiCitation[];
  recommendations?: string[];
  retryQuestion?: string;
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Ask about equipment, maintenance history, or compliance. Live mode sends your question to the shared API.',
    sender: 'ai',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

const SUGGESTED_QUESTIONS = [
  'Which components belong to Pump P-101?',
  'What failure mode is linked to Conveyor CB-410?',
  'Which supplier provides the Boiler BLR-501 safety valve?',
  'Why is Compressor C-305 in maintenance?',
];

function currentTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function QueryScreen() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [busy, setBusy] = useState(false);
  const messageListRef = useRef<FlatList<Message>>(null);
  const queryActive = useRef(false);

  const runAssistantQuery = async (question: string) => {
    if (queryActive.current || !question.trim()) return;
    queryActive.current = true;
    setBusy(true);
    const responseId = `${Date.now()}-ai`;
    try {
      if (!API_IS_CONFIGURED) {
        setMessages((previous) => [...previous, {
          id: responseId,
          text: `Fixture mode: this question was not sent to the AI API. Configure EXPO_PUBLIC_API_URL to connect shared query services. Your question was: “${question}”`,
          sender: 'ai',
          timestamp: currentTime(),
          sourceMode: 'Fixture reply',
        }]);
        return;
      }

      const response = await aiApi.query({ question, top_k: 5, include_graph_evidence: true });
      setMessages((previous) => [...previous, {
        id: responseId,
        text: response.answer,
        sender: 'ai',
        timestamp: currentTime(),
        sourceMode: response.source_mode,
        citations: response.citations,
        recommendations: response.recommendations,
      }]);
    } catch (cause) {
      const message = cause instanceof ApiError ? cause.message : 'The AI query could not be completed. Please try again.';
      setMessages((previous) => [...previous, {
        id: responseId,
        text: message,
        sender: 'ai',
        timestamp: currentTime(),
        sourceMode: 'Request failed',
        retryQuestion: question,
      }]);
    } finally {
      queryActive.current = false;
      setBusy(false);
    }
  };

  const sendMessage = (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    setMessages((previous) => [...previous, {
      id: `${Date.now()}-user`,
      text: question,
      sender: 'user',
      timestamp: currentTime(),
    }]);
    setInputText('');
    void runAssistantQuery(question);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageBubble, item.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
      {item.sender === 'ai' ? <Text style={styles.aiLabel}>🤖 Industrial Brain</Text> : null}
      {item.sourceMode ? <Text style={styles.sourceMode}>{item.sourceMode}</Text> : null}
      <Text style={[styles.messageText, item.sender === 'user' && styles.userMessageText]}>{item.text}</Text>
      {item.citations?.length ? (
        <View style={styles.evidenceSection}>
          <Text style={styles.evidenceTitle}>Sources</Text>
          {item.citations.slice(0, 3).map((citation) => (
            <View key={`${citation.document_id}-${citation.chunk_id}`} style={styles.citation}>
              <Text style={styles.citationTitle}>{citation.title}{citation.page ? ` · p. ${citation.page}` : ''}</Text>
              <Text style={styles.citationExcerpt} numberOfLines={3}>{citation.excerpt}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {item.recommendations?.length ? (
        <View style={styles.evidenceSection}>
          <Text style={styles.evidenceTitle}>Recommendations</Text>
          {item.recommendations.slice(0, 3).map((recommendation, index) => (
            <Text key={`${index}-${recommendation}`} style={styles.recommendation}>• {recommendation}</Text>
          ))}
        </View>
      ) : null}
      {item.retryQuestion ? (
        <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => void runAssistantQuery(item.retryQuestion!)} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry request</Text>
        </TouchableOpacity>
      ) : null}
      <Text style={styles.timestamp}>{item.timestamp}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Ask AI</Text>
          <DataModeNotice />
        </View>

        <FlatList
          ref={messageListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => messageListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            busy ? (
              <View style={styles.thinking}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.thinkingText}>Querying the shared API…</Text>
              </View>
            ) : messages.length <= 1 ? (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>Try asking:</Text>
                {SUGGESTED_QUESTIONS.map((question) => (
                  <TouchableOpacity key={question} style={styles.suggestionChip} onPress={() => sendMessage(question)}>
                    <Text style={styles.suggestionText}>{question}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            accessibilityLabel="Ask a question"
            editable={!busy}
            style={styles.input}
            placeholder="Ask about equipment, maintenance…"
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => sendMessage(inputText)}
            returnKeyType="send"
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Send question"
            disabled={busy || !inputText.trim()}
            style={[styles.sendButton, (busy || !inputText.trim()) && styles.sendDisabled]}
            onPress={() => sendMessage(inputText)}
          >
            {busy ? <ActivityIndicator color={colors.background} /> : <Text style={styles.sendIcon}>➤</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...typography.h2, color: colors.text },
  messageList: { padding: spacing.lg, paddingBottom: spacing.md, flexGrow: 1 },
  messageBubble: { maxWidth: '88%', padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  userBubble: { backgroundColor: colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: colors.surfaceLight, alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  aiLabel: { ...typography.caption, color: colors.primary, fontWeight: '600', marginBottom: spacing.xs },
  sourceMode: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  messageText: { ...typography.body, color: colors.text },
  userMessageText: { color: colors.background },
  timestamp: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs, alignSelf: 'flex-end' },
  evidenceSection: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.md, paddingTop: spacing.sm },
  evidenceTitle: { ...typography.caption, color: colors.primary, fontWeight: '700', marginBottom: spacing.xs },
  citation: { marginBottom: spacing.sm },
  citationTitle: { ...typography.caption, color: colors.text, fontWeight: '600' },
  citationExcerpt: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  recommendation: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  retryButton: { alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.md },
  retryText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  suggestionsContainer: { marginTop: spacing.md },
  suggestionsTitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  suggestionChip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginBottom: spacing.sm },
  suggestionText: { ...typography.bodySmall, color: colors.primary },
  thinking: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  thinkingText: { ...typography.caption, color: colors.textSecondary },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  input: { flex: 1, minHeight: 44, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.xl, paddingHorizontal: spacing.lg, ...typography.body, color: colors.text },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm },
  sendDisabled: { opacity: 0.55 },
  sendIcon: { fontSize: 18, color: colors.background },
});
