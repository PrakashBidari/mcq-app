// components/SettingsSidebar.tsx
import { useAuth } from "@/context/AuthContext";
import ThemeManager from "@/utils/ThemeManager";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
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
  const slideAnim = React.useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);
  // const [darkMode, setDarkMode] = React.useState(false);

  // const [colors, setColors] = useState(ThemeManager.getColors());

  // Inside component:
  const [isDark, setIsDark] = useState(ThemeManager.getIsDark());

  const { logout, user } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          onClose();
          // Note: Navigation to login will happen automatically via index.tsx
        },
      },
    ]);
  };

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 65,
            friction: 10,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 50);
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
      // alert(
      //   `Theme changed to ${ThemeManager.getIsDark() ? ThemeManager.getColors().primary : "Light"} Mode`,
      // );
    });
    return unsubscribe;
  }, []);

  const handleToggle = () => {
    ThemeManager.toggle();
  };

  const menuItems = [
    {
      id: "profile",
      title: "My Profile",
      icon: "person",
      screen: "Profile",
      color: "#7c3aed",
      bgColor: "#f3e8ff",
    },
    {
      id: "learning",
      title: "My Learning",
      icon: "book",
      screen: "MyLearning",
      color: "#2563eb",
      bgColor: "#dbeafe",
    },
    {
      id: "faqs",
      title: "FAQs",
      icon: "help-circle",
      screen: "FAQs",
      color: "#059669",
      bgColor: "#d1fae5",
    },
    {
      id: "blogs",
      title: "Blogs",
      icon: "newspaper",
      screen: "Blogs",
      color: "#dc2626",
      bgColor: "#fee2e2",
    },
  ];

  const settingsSections = [
    {
      title: "Account",
      items: [
        { icon: "person-outline", label: "Edit Profile", hasArrow: true },
        {
          icon: "lock-closed-outline",
          label: "Change Password",
          hasArrow: true,
        },
        { icon: "mail-outline", label: "Email Preferences", hasArrow: true },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: "notifications-outline",
          label: "Push Notifications",
          hasSwitch: true,
          value: notifications,
          onToggle: setNotifications,
        },
        {
          icon: "moon-outline",
          label: "Dark Mode",
          hasSwitch: true,
          value: isDark,
          onToggle: handleToggle,
        },
        { icon: "language-outline", label: "Language", hasArrow: true },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: "help-circle-outline", label: "Help Center", hasArrow: true },
        { icon: "chatbubble-outline", label: "Contact Us", hasArrow: true },
        { icon: "star-outline", label: "Rate App", hasArrow: true },
      ],
    },
    {
      title: "About",
      items: [
        {
          icon: "information-circle-outline",
          label: "About App",
          hasArrow: true,
        },
        {
          icon: "document-text-outline",
          label: "Terms of Service",
          hasArrow: true,
        },
        { icon: "shield-outline", label: "Privacy Policy", hasArrow: true },
      ],
    },
  ];

  return (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
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
              {/* <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={["#fbbf24", "#f59e0b"]}
                  style={styles.avatarGradient}
                >
                  <Ionicons name="school" size={40} color="#fff" />
                </LinearGradient>
              </View> */}
              <Text style={styles.userName}>MCQ Hub</Text>
              <Text style={styles.userEmail}>Explore & Master</Text>
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
            <View style={styles.menuContainer}>
              <Text style={styles.sectionTitle}>QUICK ACCESS</Text>
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
                    style={styles.menuItem}
                    onPress={() => {
                      onNavigate(item.screen);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.menuIconContainer,
                        { backgroundColor: item.bgColor },
                      ]}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={22}
                        color={item.color}
                      />
                    </View>
                    <View style={styles.menuTextContainer}>
                      <Text style={styles.menuText}>{item.title}</Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#cbd5e1"
                    />
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>

            {/* Settings Sections */}
            <View style={styles.settingsContainer}>
              <Text style={styles.sectionTitle}>SETTINGS</Text>
              {settingsSections.map((section, sectionIndex) => (
                <View key={sectionIndex} style={styles.settingsSection}>
                  <Text style={styles.settingsSectionTitle}>
                    {section.title}
                  </Text>
                  <View style={styles.settingsList}>
                    {section.items.map((item, itemIndex) => (
                      <TouchableOpacity
                        key={itemIndex}
                        style={[
                          styles.settingsItem,
                          itemIndex !== section.items.length - 1 &&
                            styles.settingsItemBorder,
                        ]}
                        activeOpacity={0.7}
                      >
                        <View style={styles.settingsIconContainer}>
                          <Ionicons
                            name={item.icon as any}
                            size={20}
                            color="#7c3aed"
                          />
                        </View>
                        <Text style={styles.settingsLabel}>{item.label}</Text>
                        {item.hasSwitch && (
                          <Switch
                            value={item.value}
                            onValueChange={item.onToggle}
                            trackColor={{ false: "#e5e7eb", true: "#c084fc" }}
                            thumbColor={item.value ? "#7c3aed" : "#f3f4f6"}
                          />
                        )}
                        {item.hasArrow && (
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#cbd5e1"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              {/* Logout Button */}
              <TouchableOpacity
                style={styles.logoutButton}
                activeOpacity={0.7}
                onPress={handleLogout} // ← ADD THIS
              >
                <Ionicons name="log-out-outline" size={22} color="#dc2626" />
                <Text style={styles.logoutText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.divider} />
            <View style={styles.footerContent}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#94a3b8"
              />
              <Text style={styles.footerText}>Version 1.0.0</Text>
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
