import { useState } from "react";
import { View, Text, ScrollView, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import { showErrorAlert } from "@/lib/errors";
import {
  useEntry,
  useUpdateEntry,
  useDeleteEntry,
} from "@/features/entry/hooks";
import { useTodosByEntry, useUpdateTodo } from "@/features/todo/hooks";
import { useSummaries } from "@/features/summary/hooks";
import { generateSummary } from "@/features/summary/api";
import { useAiPreferences } from "@/features/ai-preferences/hooks";
import { buildAiContext } from "@/features/ai-preferences/context";
import { useSettingsStore } from "@/stores/settingsStore";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function EntryDetailScreen() {
  const { id, autoEdit } = useLocalSearchParams<{
    id: string;
    autoEdit?: string;
  }>();
  const router = useRouter();
  const { data: entry, isLoading, error } = useEntry(id!);
  const { data: relatedTodos } = useTodosByEntry(id!);
  const { data: dailySummaries } = useSummaries("daily", entry?.date);
  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();
  const updateTodo = useUpdateTodo();
  const queryClient = useQueryClient();
  const { data: aiPrefs } = useAiPreferences();
  const { username, occupation, interests } = useSettingsStore();
  const { t } = useTranslation("entry");
  const { t: tCommon } = useTranslation("common");
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [autoEditApplied, setAutoEditApplied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (isLoading) return <LoadingState />;

  if (error || !entry) {
    return (
      <ErrorDisplay
        error={error ?? null}
        fallbackMessage={t("detail.notFound")}
      />
    );
  }

  // Auto-enter edit mode when redirected from new entry (daily limit)
  if (autoEdit === "true" && entry && !autoEditApplied) {
    setEditText(entry.raw_text);
    setIsEditing(true);
    setAutoEditApplied(true);
  }

  // ConfirmModal replaces Alert.alert (broken on web) and window.confirm (ugly)
  // Navigation: router.replace (not router.back) to avoid 404 on deleted entry
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteEntry.mutateAsync(entry.id);
      queryClient.removeQueries({ queryKey: ['entries', entry.id] });
      await queryClient.invalidateQueries({ queryKey: ['entries'] });
      setShowDeleteModal(false);
      router.replace('/(tabs)/timeline');
    } catch (e: unknown) {
      setIsDeleting(false);
      showErrorAlert(t("detail.deleteFailed"), e);
    }
  };

  const handleEdit = () => {
    setEditText(entry.raw_text);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    try {
      await updateEntry.mutateAsync({
        id: entry.id,
        input: { raw_text: editText },
      });
      setIsEditing(false);
    } catch (e: unknown) {
      showErrorAlert(t("detail.editFailed"), e);
    }
  };

  const handleSync = async () => {
    if (!entry || isSyncing) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const aiContext = buildAiContext(aiPrefs, {
        username,
        occupation,
        interests,
      });
      const result = await generateSummary(entry.date, aiContext);
      queryClient.invalidateQueries({ queryKey: ["summaries"] });
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      queryClient.invalidateQueries({ queryKey: ["entry", id] });
      const remaining = (result.max_count || 3) - (result.gen_count || 1);
      setSyncFeedback(
        t("detail.syncSuccess") +
          " " +
          t("detail.syncRemaining", { remaining, max: result.max_count || 3 }),
      );
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (e: any) {
      if (
        e?.status === 429 ||
        e?.body?.error === "daily_summary_limit_reached"
      ) {
        const body = e?.body || {};
        setSyncFeedback(
          t("detail.syncLimitReached", {
            count: body.gen_count || 3,
            max: body.max_count || 3,
          }),
        );
      } else {
        showErrorAlert(t("detail.syncFailed"), e);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleTodo = (todoId: string, currentStatus: string) => {
    updateTodo.mutate({
      id: todoId,
      updates: { status: currentStatus === "pending" ? "done" : "pending" },
    });
  };

  const dailySummary = dailySummaries?.[0];

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      <View className="p-6">
        {/* Header with actions */}
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {entry.date}
            </Text>
            <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {new Date(entry.created_at).toLocaleString()}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Button
              title={
                isEditing ? tCommon("action.cancel") : tCommon("action.edit")
              }
              variant="ghost"
              size="sm"
              onPress={isEditing ? () => setIsEditing(false) : handleEdit}
            />
            <Button
              title={tCommon("action.delete")}
              variant="ghost"
              size="sm"
              onPress={() => setShowDeleteModal(true)}
            />
          </View>
        </View>

        {/* Content */}
        {isEditing ? (
          <View className="mb-6">
            <TextInput
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-base text-gray-900 dark:text-gray-100 leading-7 min-h-[120px] bg-white dark:bg-gray-800"
              value={editText}
              onChangeText={setEditText}
              multiline
              textAlignVertical="top"
              autoFocus
            />
            <View className="mt-3">
              <Button
                title={tCommon("action.save")}
                onPress={handleSaveEdit}
                loading={updateEntry.isPending}
              />
            </View>
          </View>
        ) : (
          <Text className="text-base text-gray-900 dark:text-gray-100 leading-7 mb-6">
            {entry.raw_text}
          </Text>
        )}

        {/* Tags */}
        {entry.tags.length > 0 && (
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {tCommon("label.tags")}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {entry.tags.map((tag, i) => (
                <Badge key={i} label={tag} variant="cyan" size="md" />
              ))}
            </View>
          </View>
        )}

        {/* Related Todos */}
        {relatedTodos && relatedTodos.length > 0 && (
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("detail.extractedTodos")}
            </Text>
            {relatedTodos.map((todo) => (
              <Card
                key={todo.id}
                className="mb-2"
                onPress={() => toggleTodo(todo.id, todo.status)}
              >
                <View className="flex-row items-center">
                  <FontAwesome
                    name={todo.status === "done" ? "check-circle" : "circle-o"}
                    size={18}
                    color={
                      todo.status === "done"
                        ? "#22c55e"
                        : isDark
                          ? "#6b7280"
                          : "#d1d5db"
                    }
                  />
                  <Text
                    className={`ml-2.5 text-sm flex-1 ${
                      todo.status === "done"
                        ? "text-gray-400 dark:text-gray-500 line-through"
                        : "text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {todo.text}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Related Daily Summary */}
        {dailySummary && (
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("detail.dailySummary")}
            </Text>
            <Card
              onPress={() => router.push("/(tabs)/summary")}
              className="bg-cyan-50 dark:bg-gray-800/50 border-cyan-100 dark:border-gray-700"
            >
              <View className="flex-row items-center">
                <FontAwesome
                  name="file-text-o"
                  size={16}
                  color={isDark ? "#22d3ee" : "#06b6d4"}
                />
                <Text
                  className="ml-2 text-sm text-cyan-700 dark:text-cyan-300 flex-1"
                  numberOfLines={2}
                >
                  {dailySummary.text}
                </Text>
                <FontAwesome
                  name="chevron-right"
                  size={12}
                  color={isDark ? "#22d3ee" : "#67e8f9"}
                />
              </View>
            </Card>
          </View>
        )}

        {/* Sync / Regenerate Summary + Todos */}
        {!isEditing && (
          <View className="mb-6">
            <Button
              title={isSyncing ? t("detail.syncing") : t("detail.syncButton")}
              variant="secondary"
              size="sm"
              onPress={handleSync}
              loading={isSyncing}
              disabled={isSyncing}
            />
            {syncFeedback && (
              <Text className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                {syncFeedback}
              </Text>
            )}
          </View>
        )}
      </View>

      <ConfirmModal
        visible={showDeleteModal}
        title={t("detail.deleteTitle")}
        message={t("detail.deleteMessage")}
        confirmLabel={tCommon("action.delete")}
        cancelLabel={tCommon("action.cancel")}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
        destructive
        loading={isDeleting}
      />
    </ScrollView>
  );
}
