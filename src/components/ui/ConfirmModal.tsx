import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useColorScheme } from "nativewind";

// ConfirmModal uses ALL inline styles with isDark conditional instead of NativeWind dark: classes
// because RN Modal renders outside the NativeWind context, so dark: classes don't work
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive,
  loading,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  loading?: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
        activeOpacity={1}
        onPress={onCancel}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{
            width: "100%",
            maxWidth: 384,
            borderRadius: 16,
            padding: 24,
            backgroundColor: isDark ? "#22344c" : "#ffffff",
          }}
        >
          {/* Title */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: isDark ? "#f3f4f6" : "#111827",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            {title}
          </Text>

          {/* Message */}
          <Text
            style={{
              fontSize: 14,
              color: isDark ? "#9ca3af" : "#6b7280",
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 20,
            }}
          >
            {message}
          </Text>

          {/* Buttons */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: isDark ? "#374151" : "#f3f4f6",
                alignItems: "center",
              }}
              onPress={onCancel}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: isDark ? "#9ca3af" : "#6b7280",
                }}
              >
                {cancelLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: destructive
                  ? isDark
                    ? "#dc2626"
                    : "#ef4444"
                  : isDark
                    ? "#06b6d4"
                    : "#0891b2",
                alignItems: "center",
                opacity: loading ? 0.7 : 1,
              }}
              onPress={onConfirm}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: "#ffffff" }}
                >
                  {confirmLabel}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
