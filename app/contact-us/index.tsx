// app/contact-us/index.tsx
import AppBottomTabBar from "@/components/AppBottomTabBar";
import { useRecaptcha } from "@/components/Recaptcha";
import { API_URL } from "@/config/constants";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ContactSettings {
  hero_title: string;
  hero_subtitle: string;
  email: string;
  phone: string;
  address: string;
  form_title: string;
  form_subtitle: string;
}

export default function ContactUsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState<ContactSettings | null>(null);
  const { Recaptcha, getToken } = useRecaptcha();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsFetching(true);
      const response = await fetch(`${API_URL}/contact/settings`);
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
      }
    } catch {
      // silent — contact info stays null
    } finally {
      setIsFetching(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSettings();
    setRefreshing(false);
  };

  const contactInfo = settings
    ? [
        {
          id: 1,
          icon: "mail",
          title: t("contact.email"),
          value: settings.email,
          action: () => Linking.openURL(`mailto:${settings.email}`),
          color: "#7c3aed",
          bgColor: "#f3e8ff",
        },
        {
          id: 2,
          icon: "call",
          title: t("contact.phone"),
          value: settings.phone,
          action: () =>
            Linking.openURL(`tel:${settings.phone.replace(/\s/g, "")}`),
          color: "#2563eb",
          bgColor: "#dbeafe",
        },
        {
          id: 3,
          icon: "location",
          title: t("contact.address"),
          value: settings.address,
          action: null,
          color: "#059669",
          bgColor: "#d1fae5",
        },
      ]
    : [];

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert(t("common.error"), t("contact.errorName"));
      return;
    }

    if (!email.trim()) {
      Alert.alert(t("common.error"), t("contact.errorEmail"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t("common.error"), t("contact.errorInvalidEmail"));
      return;
    }

    if (!message.trim()) {
      Alert.alert(t("common.error"), t("contact.errorMessage"));
      return;
    }

    if (message.length > 1000) {
      Alert.alert(t("common.error"), t("contact.errorMessageLong"));
      return;
    }

    setIsLoading(true);

    let recaptchaToken: string;
    try {
      recaptchaToken = await getToken();
    } catch (e) {
      setIsLoading(false);
      Alert.alert(
        t("common.error"),
        e instanceof Error ? e.message : t("common.recaptchaFailed"),
      );
      return;
    }

    try {
      const response = await fetch(`${API_URL}/contact/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          recaptcha_token: recaptchaToken,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          t("common.success"),
          data.message || t("contact.successMessage"),
          [
            {
              text: t("common.ok"),
              onPress: () => {
                setName("");
                setEmail("");
                setMessage("");
              },
            },
          ],
        );
      } else {
        Alert.alert(t("common.error"), data.message || t("contact.errorSend"));
      }
    } catch {
      Alert.alert(t("common.error"), t("contact.errorSendRetry"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="text-gray-600 mt-4 text-base">{t("contact.loading")}</Text>
      </SafeAreaView>
    );
  }

  if (!settings) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={60} color="#D1D5DB" />
        <Text className="text-gray-800 text-xl font-bold mt-4 mb-2">
          {t("contact.settingsNotAvailable")}
        </Text>
        <Text className="text-gray-600 text-sm text-center mb-6">
          {t("contact.settingsNotConfigured")}
        </Text>
        <TouchableOpacity
          onPress={fetchSettings}
          className="bg-purple-600 px-8 py-3 rounded-2xl"
        >
          <Text className="text-white font-bold text-base">{t("contact.retry")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {Recaptcha}
      {/* Header */}
      <View className="bg-white px-6 pt-4 pb-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">{t("contact.title")}</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#7c3aed"]}
            tintColor="#7c3aed"
          />
        }
      >
        {/* Hero Section */}
        <View className="relative overflow-hidden">
          <LinearGradient
            colors={["#7c3aed", "#a855f7", "#ec4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="px-6 py-10"
          >
            <View className="items-center">
              <View className="bg-white/20 w-20 h-20 rounded-full items-center justify-center mb-4">
                <Ionicons name="chatbubbles" size={40} color="#fff" />
              </View>
              <Text className="text-white text-2xl font-bold mb-2 text-center">
                {settings.hero_title}
              </Text>
              <Text className="text-white/90 text-sm text-center max-w-xs">
                {settings.hero_subtitle}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Contact Cards */}
        <View className="px-6 -mt-8">
          <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            {contactInfo.map((info, index) => (
              <TouchableOpacity
                key={info.id}
                onPress={info.action || undefined}
                disabled={!info.action}
                activeOpacity={info.action ? 0.7 : 1}
                className={`flex-row items-center py-4 ${
                  index !== contactInfo.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                  style={{ backgroundColor: info.bgColor }}
                >
                  <Ionicons
                    name={info.icon as any}
                    size={24}
                    color={info.color}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 text-xs font-semibold mb-1">
                    {info.title}
                  </Text>
                  <Text className="text-gray-900 text-base font-semibold">
                    {info.value}
                  </Text>
                </View>
                {info.action && (
                  <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Form */}
        <View className="px-6 mt-8">
          <Text className="text-gray-900 text-xl font-bold mb-2">
            {settings.form_title}
          </Text>
          <Text className="text-gray-500 text-sm mb-6">
            {settings.form_subtitle}
          </Text>

          {/* Name Input */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">
              {t("contact.yourName")} <Text className="text-red-500">*</Text>
            </Text>
            <View className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex-row items-center">
              <Ionicons name="person-outline" size={20} color="#9ca3af" />
              <TextInput
                placeholder={t("contact.namePlaceholder")}
                value={name}
                onChangeText={setName}
                className="flex-1 ml-3 text-gray-900 text-base"
                placeholderTextColor="#9ca3af"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">
              {t("contact.emailAddress")} <Text className="text-red-500">*</Text>
            </Text>
            <View className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex-row items-center">
              <Ionicons name="mail-outline" size={20} color="#9ca3af" />
              <TextInput
                placeholder={t("contact.emailPlaceholder")}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="flex-1 ml-3 text-gray-900 text-base"
                placeholderTextColor="#9ca3af"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Message Input */}
          <View className="mb-6">
            <Text className="text-gray-700 font-semibold mb-2">
              {t("contact.yourMessage")} <Text className="text-red-500">*</Text>
            </Text>
            <View className="bg-white border border-gray-200 rounded-xl px-4 py-3">
              <TextInput
                placeholder={t("contact.messagePlaceholder")}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="text-gray-900 text-base min-h-[120px]"
                placeholderTextColor="#9ca3af"
                maxLength={1000}
                editable={!isLoading}
              />
            </View>
            <Text className="text-gray-400 text-xs mt-1 ml-1">
              {message.length} / 1000 {t("contact.characters")}
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className="bg-purple-600 rounded-xl py-4 flex-row items-center justify-center shadow-sm"
            style={{
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" />
                <Text className="text-white font-bold text-base ml-2">
                  {t("contact.sendMessage")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* FAQ Suggestion */}
        <View className="mx-6 mt-8 bg-purple-50 rounded-2xl p-5 border border-purple-100">
          <View className="flex-row items-start">
            <View className="bg-purple-100 w-10 h-10 rounded-full items-center justify-center mr-3">
              <Ionicons name="help-circle" size={24} color="#7c3aed" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-bold text-base mb-1">
                {t("contact.lookingForAnswers")}
              </Text>
              <Text className="text-gray-600 text-sm mb-3">
                {t("contact.faqSuggestion")}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/faqs")}
                className="bg-purple-600 px-4 py-2 rounded-lg self-start"
              >
                <Text className="text-white font-semibold text-sm">
                  {t("contact.visitFaqs")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      <AppBottomTabBar />
    </SafeAreaView>
  );
}
