// app/profile/index.tsx
import AppBottomTabBar from "@/components/AppBottomTabBar";
import { API_URL } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const { setSidebarVisible } = useSidebar();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Add state for password visibility at the top with other states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch user profile
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const response = await fetch(`${API_URL}/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        Alert.alert(t("common.error"), t("profile.errorInvalidResponse"));
        setIsLoading(false);
        return;
      }

      if (response.status === 401) {
        Alert.alert(t("profile.errorSessionExpired"), t("profile.errorLoginAgain"));
        await AsyncStorage.removeItem("auth_token");
        router.replace("/(tabs)");
        return;
      }

      if (data.success) {
        setUser(data.data);
      } else {
        Alert.alert(t("common.error"), data.message || t("profile.errorFailedLoad"));
      }
    } catch {
      Alert.alert(t("common.error"), t("profile.errorConnection"));
    } finally {
      setIsLoading(false);
    }
  };

  // Pick and upload image
  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(t("profile.errorPermission"), t("profile.errorPermissionMsg"));
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, // Compress to reduce size
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);

      // Get file info
      const response = await fetch(uri);
      const blob = await response.blob();

      // Check file size (300KB = 300 * 1024 bytes)
      if (blob.size > 300 * 1024) {
        Alert.alert(t("profile.errorFileTooLarge"), t("profile.errorFileTooLargeMsg"));
        setUploading(false);
        return;
      }

      const extension = uri.split(".").pop()?.toLowerCase() || "jpg";
      const mimeMap: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
      };
      const mimeType = mimeMap[extension] ?? "image/jpeg";

      const formData = new FormData();
      formData.append("image", {
        uri: uri,
        type: mimeType,
        name: `profile.${extension}`,
      } as any);

      const uploadResponse = await fetch(`${API_URL}/update-profile-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const data = await uploadResponse.json();

      if (data.success) {
        Alert.alert(t("common.success"), t("profile.successImageUpdate"));
        fetchProfile();
      } else {
        Alert.alert(t("common.error"), data.message || t("profile.errorImageUpload"));
      }
    } catch {
      Alert.alert(t("common.error"), t("profile.errorImageUpload"));
    } finally {
      setUploading(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t("common.error"), t("profile.errorFillFields"));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t("common.error"), t("profile.errorMismatch"));
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(t("common.error"), t("profile.errorLength"));
      return;
    }

    try {
      setPasswordLoading(true);
      const token = await AsyncStorage.getItem("auth_token");

      const response = await fetch(`${API_URL}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(t("common.success"), t("profile.successPasswordChange"));
        setShowPasswordModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        Alert.alert(t("common.error"), data.message || t("profile.errorPasswordChange"));
      }
    } catch {
      Alert.alert(t("common.error"), t("profile.errorPasswordChange"));
    } finally {
      setPasswordLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="text-gray-600 mt-4 text-base">{t("profile.loadingProfile")}</Text>
      </SafeAreaView>
    );
  }

  if (notLoggedIn) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white px-6 pt-4 pb-4 border-b border-gray-100">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
            >
              <Ionicons name="arrow-back" size={22} color="#374151" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900">{t("profile.title")}</Text>
            <View style={{ width: 40 }} />
          </View>
        </View>

        {/* Login prompt */}
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-24 h-24 bg-purple-50 rounded-full items-center justify-center mb-6">
            <Ionicons name="person-circle-outline" size={56} color="#a855f7" />
          </View>
          <Text className="text-gray-900 text-2xl font-bold mb-2 text-center">
            {t("profile.notLoggedInTitle")}
          </Text>
          <Text className="text-gray-500 text-sm text-center mb-8 leading-5">
            {t("profile.notLoggedInDesc")}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/login")}
            className="bg-purple-600 px-10 py-4 rounded-2xl w-full items-center mb-3"
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold text-base">{t("profile.loginBtn")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/register")}
            className="border border-purple-600 px-10 py-4 rounded-2xl w-full items-center"
            activeOpacity={0.85}
          >
            <Text className="text-purple-600 font-bold text-base">{t("profile.registerBtn")}</Text>
          </TouchableOpacity>
        </View>
        <AppBottomTabBar />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Ionicons name="person-circle-outline" size={80} color="#D1D5DB" />
        <Text className="text-gray-800 text-xl font-bold mt-4 mb-2">
          {t("profile.failedLoad")}
        </Text>
        <Text className="text-gray-600 text-sm text-center mb-6">
          {t("profile.failedLoadDesc")}
        </Text>
        <TouchableOpacity
          onPress={fetchProfile}
          className="bg-purple-600 px-8 py-3 rounded-2xl"
        >
          <Text className="text-white font-bold text-base">{t("profile.retry")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 px-8 py-3"
        >
          <Text className="text-gray-600 font-semibold">{t("profile.goBack")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-4 pb-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">{t("profile.title")}</Text>
          <TouchableOpacity
            className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
            onPress={() => setSidebarVisible(true)}
          >
            <Ionicons name="settings-outline" size={22} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Profile Card */}
        <View className="px-6 pt-6 pb-4">
          <View
            className="bg-white rounded-3xl p-6 border border-gray-100"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            {/* Avatar and Basic Info */}
            <View className="items-center mb-6">
              <TouchableOpacity
                onPress={pickImage}
                disabled={uploading}
                className="relative mb-4"
              >
                <Image
                  source={{
                    uri:
                      user.profile_image ||
                      `https://ui-avatars.com/api/?name=${user.name}&size=200&background=7c3aed&color=fff`,
                  }}
                  className="w-24 h-24 rounded-full"
                />
                {uploading ? (
                  <View className="absolute inset-0 bg-black/50 rounded-full items-center justify-center">
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                ) : (
                  <View className="absolute bottom-0 right-0 bg-purple-600 w-8 h-8 rounded-full items-center justify-center border-4 border-white">
                    <Ionicons name="camera" size={14} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
              <Text className="text-gray-900 text-2xl font-bold mb-1">
                {user.name}
              </Text>
              <Text className="text-gray-500 text-sm mb-3">{user.email}</Text>
              <View className="bg-purple-50 px-4 py-1.5 rounded-full">
                <Text className="text-purple-600 text-sm font-semibold">
                  {t("profile.memberSince")} {user.created_at}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="space-y-3">
              <TouchableOpacity
                onPress={() => setShowPasswordModal(true)}
                className="bg-purple-50 p-4 rounded-2xl flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <View className="bg-purple-100 w-10 h-10 rounded-full items-center justify-center mr-3">
                    <Ionicons name="lock-closed" size={18} color="#7c3aed" />
                  </View>
                  <Text className="text-purple-700 font-bold text-base">
                    {t("profile.changePassword")}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#7c3aed" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={pickImage}
                className="bg-blue-50 p-4 rounded-2xl flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <View className="bg-blue-100 w-10 h-10 rounded-full items-center justify-center mr-3">
                    <Ionicons name="image" size={18} color="#2563eb" />
                  </View>
                  <Text className="text-blue-700 font-bold text-base">
                    {t("profile.updatePicture")}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#2563eb" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setShowPasswordModal(false)}
          />

          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-gray-800 text-xl font-bold">
                {t("profile.changePasswordTitle")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                className="bg-gray-100 w-8 h-8 rounded-full items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#1F2937" />
              </TouchableOpacity>
            </View>

            {/* Current Password */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2">
                {t("profile.currentPassword")}
              </Text>
              <View className="relative">
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrentPassword}
                  placeholder={t("profile.enterCurrentPassword")}
                  className="bg-gray-50 px-4 py-3 rounded-xl text-gray-800 pr-12"
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-3"
                >
                  <Ionicons
                    name={
                      showCurrentPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={24}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2">
                {t("profile.newPassword")}
              </Text>
              <View className="relative">
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  placeholder={t("profile.enterNewPassword")}
                  className="bg-gray-50 px-4 py-3 rounded-xl text-gray-800 pr-12"
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-3"
                >
                  <Ionicons
                    name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                    size={24}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2">
                {t("profile.confirmPassword")}
              </Text>
              <View className="relative">
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholder={t("profile.confirmNewPassword")}
                  className="bg-gray-50 px-4 py-3 rounded-xl text-gray-800 pr-12"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-3"
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={24}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={passwordLoading}
              className="bg-purple-600 py-4 rounded-2xl"
            >
              {passwordLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-bold text-center text-base">
                  {t("profile.changePasswordBtn")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <AppBottomTabBar />
    </SafeAreaView>
  );
}
