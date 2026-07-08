// components/SettingsSidebar.tsx
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import ThemeManager from "@/utils/ThemeManager";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = width * 0.85;

interface SettingsSidebarProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  visible,
  onClose,
  onNavigate,
}) => {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const slideAnim = React.useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);

  const [isDark, setIsDark] = useState(ThemeManager.getIsDark());

  const { logout, user, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(t("sidebar.logoutTitle"), t("sidebar.logoutMessage"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("sidebar.logOut"),
        style: "destructive",
        onPress: async () => {
          await logout();
          onClose();
        },
      },
    ]);
  };

  useEffect(() => {
    if (visible) {
      // Reset to off-screen before making the Modal visible so onShow
      // always starts the animation from the correct position.
      slideAnim.setValue(-SIDEBAR_WIDTH);
      fadeAnim.setValue(0);
      setModalVisible(true);
      // Animation is kicked off by Modal's onShow callback below —
      // no setTimeout needed; onShow fires as soon as the Modal renders.
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible]);

  useEffect(() => {
    const unsubscribe = ThemeManager.subscribe(() => {
      setIsDark(ThemeManager.getIsDark());
    });
    return unsubscribe;
  }, []);

  const handleToggle = () => {
    ThemeManager.toggle();
  };

  const menuItems = [
    {
      id: "profile",
      title: t("sidebar.myProfile"),
      icon: "person",
      screen: "Profile",
      color: "#7c3aed",
      bgColor: "#f3e8ff",
    },
    {
      id: "learning",
      title: t("sidebar.myLearning"),
      icon: "book",
      screen: "MyLearning",
      color: "#2563eb",
      bgColor: "#dbeafe",
    },
    {
      id: "faqs",
      title: t("sidebar.faqs"),
      icon: "help-circle",
      screen: "FAQs",
      color: "#059669",
      bgColor: "#d1fae5",
    },
    {
      id: "blogs",
      title: t("sidebar.blogs"),
      icon: "newspaper",
      screen: "Blogs",
      color: "#dc2626",
      bgColor: "#fee2e2",
    },
  ];

  const handleModalShow = React.useCallback(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, fadeAnim]);

  return (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      onShow={handleModalShow}
    >
      <View style={[styles.container]}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        {/* Sidebar */}
        <Animated.View
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: slideAnim }],
              backgroundColor: isDark ? "#1a1a2e" : "#fff",
            },
          ]}
        >
          {/* Header with Gradient */}
          <LinearGradient
            colors={["#7c3aed", "#a855f7", "#c084fc"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>

            {/* Profile Section */}
            <View style={styles.profileSection}>
              <Text style={styles.userName}>{t("sidebar.appName")}</Text>
              <Text style={styles.userEmail}>{t("sidebar.tagline")}</Text>
            </View>

            {/* Decorative Circles */}
            <View style={styles.circle1} />
            <View style={styles.circle2} />
          </LinearGradient>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Quick Menu Items */}
            <View style={[styles.menuContainer, { borderBottomColor: isDark ? "#2d2d44" : "#f1f5f9" }]}>
              <Text style={[styles.sectionTitle, { color: isDark ? "#64748b" : "#94a3b8" }]}>
                {t("sidebar.quickAccess")}
              </Text>
              {menuItems.map((item, index) => (
                <Animated.View
                  key={item.id}
                  style={{
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateX: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-50, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: isDark ? "#16213e" : "#fff" }]}
                    onPress={() => {
                      onNavigate(item.screen);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.menuIconContainer,
                        { backgroundColor: isDark ? item.color + "22" : item.bgColor },
                      ]}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={22}
                        color={item.color}
                      />
                    </View>
                    <View style={styles.menuTextContainer}>
                      <Text style={[styles.menuText, { color: isDark ? "#f1f5f9" : "#1e293b" }]}>{item.title}</Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={isDark ? "#ffffff50" : "#cbd5e1"}
                    />
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>

            {/* Settings Sections */}
            <View style={styles.settingsContainer}>
              <Text style={[styles.sectionTitle, { color: isDark ? "#64748b" : "#94a3b8" }]}>
                {t("sidebar.settings")}
              </Text>

              {/* Preferences Section */}
              <View style={styles.settingsSection}>
                <Text style={[styles.settingsSectionTitle, { color: isDark ? "#94a3b8" : "#64748b" }]}>
                  {t("sidebar.preferences")}
                </Text>
                <View style={[styles.settingsList, { backgroundColor: isDark ? "#16213e" : "#fff", borderColor: isDark ? "#2d2d44" : "#f1f5f9" }]}>
                  {/* Dark Mode */}
                  <View style={[styles.settingsItem, styles.settingsItemBorder, { borderBottomColor: isDark ? "#2d2d44" : "#f8fafc" }]}>
                    <View style={[styles.settingsIconContainer, { backgroundColor: isDark ? "#2d1f4e" : "#f8f4ff" }]}>
                      <Ionicons name="moon-outline" size={20} color={isDark ? "#a855f7" : "#7c3aed"} />
                    </View>
                    <Text style={[styles.settingsLabel, { color: isDark ? "#f1f5f9" : "#334155" }]}>
                      {t("sidebar.darkMode")}
                    </Text>
                    <Switch
                      value={isDark}
                      onValueChange={handleToggle}
                      trackColor={{ false: isDark ? "#374151" : "#e5e7eb", true: "#c084fc" }}
                      thumbColor={isDark ? "#7c3aed" : "#f3f4f6"}
                    />
                  </View>

                  {/* Language Picker */}
                  <View style={styles.settingsItem}>
                    <View style={[styles.settingsIconContainer, { backgroundColor: isDark ? "#2d1f4e" : "#f8f4ff" }]}>
                      <Ionicons name="language-outline" size={20} color={isDark ? "#a855f7" : "#7c3aed"} />
                    </View>
                    <Text style={[styles.settingsLabel, { color: isDark ? "#f1f5f9" : "#334155" }]}>
                      {t("sidebar.language")}
                    </Text>
                    <View style={styles.languageToggle}>
                      <TouchableOpacity
                        style={[
                          styles.langBtn,
                          language === "en" && styles.langBtnActive,
                          isDark && language !== "en" && styles.langBtnDark,
                        ]}
                        onPress={() => setLanguage("en")}
                      >
                        <Text style={[
                          styles.langBtnText,
                          language === "en" && styles.langBtnTextActive,
                          isDark && language !== "en" && { color: "#94a3b8" },
                        ]}>EN</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.langBtn,
                          language === "ja" && styles.langBtnActive,
                          isDark && language !== "ja" && styles.langBtnDark,
                        ]}
                        onPress={() => setLanguage("ja")}
                      >
                        <Text style={[
                          styles.langBtnText,
                          language === "ja" && styles.langBtnTextActive,
                          isDark && language !== "ja" && { color: "#94a3b8" },
                        ]}>日本語</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Support Section */}
              <View style={styles.settingsSection}>
                <Text style={[styles.settingsSectionTitle, { color: isDark ? "#94a3b8" : "#64748b" }]}>
                  {t("sidebar.support")}
                </Text>
                <View style={[styles.settingsList, { backgroundColor: isDark ? "#16213e" : "#fff", borderColor: isDark ? "#2d2d44" : "#f1f5f9" }]}>
                  <TouchableOpacity
                    style={styles.settingsItem}
                    activeOpacity={0.7}
                    onPress={() => { onNavigate("ContactUs"); onClose(); }}
                  >
                    <View style={[styles.settingsIconContainer, { backgroundColor: isDark ? "#2d1f4e" : "#f8f4ff" }]}>
                      <Ionicons name="chatbubble-outline" size={20} color={isDark ? "#a855f7" : "#7c3aed"} />
                    </View>
                    <Text style={[styles.settingsLabel, { color: isDark ? "#f1f5f9" : "#334155" }]}>
                      {t("sidebar.contactUs")}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={isDark ? "#ffffff50" : "#cbd5e1"} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* About Section */}
              <View style={styles.settingsSection}>
                <Text style={[styles.settingsSectionTitle, { color: isDark ? "#94a3b8" : "#64748b" }]}>
                  {t("sidebar.about")}
                </Text>
                <View style={[styles.settingsList, { backgroundColor: isDark ? "#16213e" : "#fff", borderColor: isDark ? "#2d2d44" : "#f1f5f9" }]}>
                  <TouchableOpacity
                    style={[styles.settingsItem, styles.settingsItemBorder, { borderBottomColor: isDark ? "#2d2d44" : "#f8fafc" }]}
                    activeOpacity={0.7}
                    onPress={() => { onNavigate("AboutApp"); onClose(); }}
                  >
                    <View style={[styles.settingsIconContainer, { backgroundColor: isDark ? "#2d1f4e" : "#f8f4ff" }]}>
                      <Ionicons name="information-circle-outline" size={20} color={isDark ? "#a855f7" : "#7c3aed"} />
                    </View>
                    <Text style={[styles.settingsLabel, { color: isDark ? "#f1f5f9" : "#334155" }]}>
                      {t("sidebar.aboutApp")}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={isDark ? "#ffffff50" : "#cbd5e1"} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.settingsItem}
                    activeOpacity={0.7}
                    onPress={() => { onNavigate("PrivacyPolicy"); onClose(); }}
                  >
                    <View style={[styles.settingsIconContainer, { backgroundColor: isDark ? "#2d1f4e" : "#f8f4ff" }]}>
                      <Ionicons name="shield-outline" size={20} color={isDark ? "#a855f7" : "#7c3aed"} />
                    </View>
                    <Text style={[styles.settingsLabel, { color: isDark ? "#f1f5f9" : "#334155" }]}>
                      {t("sidebar.privacyPolicy")}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={isDark ? "#ffffff50" : "#cbd5e1"} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login / Logout Button */}
              {isAuthenticated ? (
                <TouchableOpacity
                  style={[styles.logoutButton, isDark && { backgroundColor: "#3b1a1a", borderColor: "#7f1d1d" }]}
                  activeOpacity={0.7}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={22} color={isDark ? "#f87171" : "#dc2626"} />
                  <Text style={[styles.logoutText, isDark && { color: "#f87171" }]}>{t("sidebar.logOut")}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.loginButton, isDark && { backgroundColor: "#2d1f4e", borderColor: "#6d28d9" }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    onClose();
                    router.push("/(auth)/login");
                  }}
                >
                  <Ionicons name="log-in-outline" size={22} color={isDark ? "#a855f7" : "#7c3aed"} />
                  <Text style={[styles.loginText, isDark && { color: "#a855f7" }]}>{t("sidebar.logIn")}</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { backgroundColor: isDark ? "#1a1a2e" : "#fff", borderTopColor: isDark ? "#2d2d44" : "#e2e8f0" }]}>
            <View style={[styles.divider, { backgroundColor: isDark ? "#2d2d44" : "#e2e8f0" }]} />
            <View style={styles.footerContent}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#94a3b8"
              />
              <Text style={styles.footerText}>{t("sidebar.version")}</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  backdropTouchable: {
    flex: 1,
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    position: "relative",
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileSection: {
    alignItems: "center",
    marginTop: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  circle1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    top: -40,
    right: -30,
  },
  circle2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    bottom: -20,
    left: -20,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  menuContainer: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 12,
    marginLeft: 8,
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },
  settingsContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  settingsSection: {
    marginBottom: 20,
  },
  settingsSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 10,
    marginLeft: 8,
  },
  settingsList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: "#f8f4ff",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#334155",
  },
  languageToggle: {
    flexDirection: "row",
    gap: 6,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  langBtnActive: {
    backgroundColor: "#7c3aed",
    borderColor: "#7c3aed",
  },
  langBtnDark: {
    backgroundColor: "#1a1a2e",
    borderColor: "#2d2d44",
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  langBtnTextActive: {
    color: "#ffffff",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
    marginBottom: 20,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#dc2626",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f3ff",
    borderWidth: 1,
    borderColor: "#c4b5fd",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
    marginBottom: 20,
  },
  loginText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#7c3aed",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    backgroundColor: "#fff",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginBottom: 16,
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
  },
});

export default SettingsSidebar;
