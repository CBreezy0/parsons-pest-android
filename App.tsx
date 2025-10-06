// App.js — Google Sign-In + Home + Diagnose + Appointments (Add to Calendar) + Support
// Add deps in Snack: see list above.

import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Image, TextInput,
  FlatList, Alert, Platform, Linking, ScrollView
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";

/* ===== Config ===== */
const PHONE = "+12052020818";
const EMAIL = "info@parsonspestdetectives.com";
const OFFICE_ADDR = "13040 Fisher Circle, McCalla, AL";
const KEY_APPTS = "@ppd_appointments";
const KEY_USER = "@ppd_user";

/* ******* IMPORTANT *******
   Add your Google OAuth client IDs here (from Google Cloud Console):
   - Web client (for Snack/Web preview) is usually enough for demo.
   This demo will gracefully fall back to “Continue as Guest” if IDs are missing.
*/
const GOOGLE_IDS = {
  web: "",      // e.g. "12345-abc123.apps.googleusercontent.com"
  android: "",  // optional for device testing
  ios: "",      // optional
};

WebBrowser.maybeCompleteAuthSession();

/* ===== Navigation ===== */
const Stack = createNativeStackNavigator();
const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: "#0B1A0B" } };

/* ===== Reusable UI ===== */
const Button = ({ label, onPress, style: s }) => (
  <TouchableOpacity onPress={onPress} style={[styles.button, s]}>
    <Text style={styles.buttonText}>{label}</Text>
  </TouchableOpacity>
);
const Card = ({ children, style: s }) => <View style={[styles.card, s]}>{children}</View>;
const PageHeading = ({ title, subtitle }) => (
  <View style={{ marginTop: 8, marginBottom: 8 }}>
    <Text style={styles.pageTitle}>{title}</Text>
    <Text style={styles.pageSub}>{subtitle}</Text>
  </View>
);
const HeaderBrand = () => (
  <View style={styles.headerBrand}>
    <Text style={styles.brandSmall}>PARSONS</Text>
    <Text style={styles.brandBig}>Pest Detectives</Text>
  </View>
);

/* ===== Auth Gate ===== */
function AuthGate({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(KEY_USER);
        setUser(json ? JSON.parse(json) : null);
      } catch {}
      setReady(true);
    })();
  }, []);

  if (!ready) return <View style={styles.center}><Text style={{color:"#E8FFE8"}}>Loading…</Text></View>;
  if (!user) return <SignInScreen onSignedIn={setUser} />;

  return children;
}

function SignInScreen({ onSignedIn }) {
  const hasIds = Boolean(GOOGLE_IDS.web || GOOGLE_IDS.android || GOOGLE_IDS.ios);

  const [request, response, promptAsync] = Google.useAuthRequest(
    {
      webClientId: GOOGLE_IDS.web || undefined,
      androidClientId: GOOGLE_IDS.android || undefined,
      iosClientId: GOOGLE_IDS.ios || undefined,
      redirectUri: makeRedirectUri({ useProxy: true }),
      scopes: ["profile", "email"],
    },
    { useProxy: true }
  );

  useEffect(() => {
    (async () => {
      if (response?.type === "success") {
        // For demo, store basic flag + email if available via id_token (not calling Google API here)
        const profile = { signedIn: true, provider: "google", ts: Date.now() };
        await AsyncStorage.setItem(KEY_USER, JSON.stringify(profile));
        onSignedIn(profile);
      }
    })();
  }, [response]);

  const continueGuest = async () => {
    const profile = { signedIn: true, provider: "guest", ts: Date.now() };
    await AsyncStorage.setItem(KEY_USER, JSON.stringify(profile));
    onSignedIn(profile);
  };

  return (
    <LinearGradient colors={["#081509", "#0E1F0E", "#122915"]} style={styles.authRoot}>
      <StatusBar style="light" />
      <HeaderBrand />
      <Card style={{ marginTop: 16, alignItems: "center" }}>
        <MaterialCommunityIcons name="shield-bug" size={56} color="#E8FFE8" />
        <Text style={[styles.pageTitle, { marginTop: 8 }]}>Welcome</Text>
        <Text style={styles.pageSub}>Sign in to book and manage appointments.</Text>
        {hasIds ? (
          <Button
            label="Continue with Google"
            onPress={() => promptAsync()}
            style={{ marginTop: 12, width: "100%" }}
          />
        ) : (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Add your Google OAuth client ID in code to enable Google Sign-In.
              </Text>
            </View>
            <Button
              label="Continue as Guest"
              onPress={continueGuest}
              style={{ marginTop: 8, width: "100%" }}
            />
          </>
        )}
      </Card>
    </LinearGradient>
  );
}

/* ===== Screens ===== */
const HomeScreen = ({ navigation }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const load = async () => {
      try { const json = await AsyncStorage.getItem(KEY_APPTS); setCount(json ? JSON.parse(json).length : 0); } catch {}
    };
    const unsub = navigation.addListener("focus", load);
    load();
    return unsub;
  }, [navigation]);

  return (
    <LinearGradient colors={["#081509", "#0E1F0E", "#122915"]} style={styles.homeRoot}>
      <StatusBar style="light" />
      <HeaderBrand />
      <Card style={styles.heroCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Protect Your Home</Text>
          <Text style={styles.heroSub}>Diagnose pests, schedule visits, and contact support—fast.</Text>
          <Button label="Book Now" onPress={() => navigation.navigate("Appointments")} style={{ marginTop: 10 }} />
        </View>
        <MaterialCommunityIcons name="shield-bug" size={48} color="#E8FFE8" />
      </Card>

      <View style={styles.grid}>
        <FeatureCard
          icon="bug" title="Diagnose a Pest" subtitle="Snap or upload a photo"
          onPress={() => navigation.navigate("Diagnose")}
        />
        <FeatureCard
          icon="calendar-clock" title="Book Appointment" subtitle="Pick a time, add notes"
          onPress={() => navigation.navigate("Appointments")} badge={count > 0 ? String(count) : undefined}
        />
        <FeatureCard
          icon="phone" title="Support" subtitle="Call, text, email, directions"
          onPress={() => navigation.navigate("Support")}
        />
      </View>
    </LinearGradient>
  );
};

const FeatureCard = ({ icon, title, subtitle, onPress, badge }) => (
  <TouchableOpacity onPress={onPress} style={styles.feature}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <MaterialCommunityIcons name={icon} size={24} color="#E8FFE8" />
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSub}>{subtitle}</Text>
      </View>
      {badge ? <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View> : null}
    </View>
  </TouchableOpacity>
);

const DiagnoseScreen = () => {
  const [imageUri, setImageUri] = useState(null);
  const [result, setResult] = useState(null);
  const [note, setNote] = useState("");

  const requestPerms = async (type) => {
    if (Platform.OS === "web") return true;
    const fn = type === "camera" ? ImagePicker.requestCameraPermissionsAsync : ImagePicker.requestMediaLibraryPermissionsAsync;
    const { granted } = await fn();
    return granted;
  };

  const pickImage = async (fromCamera) => {
    const ok = await requestPerms(fromCamera ? "camera" : "library");
    if (!ok) { Alert.alert("Permission needed", "Please allow access to continue."); return; }
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!res.canceled) { setImageUri(res.assets[0].uri); setResult(null); }
  };

  const identify = () => {
    if (!imageUri) { Alert.alert("Add a photo first"); return; }
    const guesses = [
      { label: "Ant", confidence: 0.91 },
      { label: "German Cockroach", confidence: 0.74 },
      { label: "House Spider", confidence: 0.56 },
      { label: "Wasp", confidence: 0.49 },
      { label: "Termite", confidence: 0.44 },
    ];
    const pick = guesses[Math.floor(Math.random() * guesses.length)];
    setResult(pick);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <PageHeading title="Diagnose a Pest" subtitle="Take or upload a photo; we’ll suggest a likely match." />
      <Card>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.photo} /> :
          <View style={styles.photoPlaceholder}><Text style={styles.photoPlaceholderText}>No photo yet</Text></View>}

        <View style={styles.row}>
          <Button label="Take Photo" onPress={() => pickImage(true)} />
          <Button label="Upload" onPress={() => pickImage(false)} />
        </View>

        <Button label="Identify Pest" onPress={identify} />

        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultMain}>{result.label} • {(result.confidence * 100).toFixed(0)}%</Text>
            <Text style={styles.resultTip}>Tip: Keep kids/pets away and avoid disturbing the area.</Text>
          </View>
        )}

        <TextInput placeholder="Add a note (optional)…" placeholderTextColor="#8BA18B"
          value={note} onChangeText={setNote} style={styles.input} />
      </Card>
    </ScrollView>
  );
};

const AppointmentsScreen = () => {
  const [when, setWhen] = useState("");
  const [where, setWhere] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      try { const json = await AsyncStorage.getItem(KEY_APPTS); setItems(json ? JSON.parse(json) : []); } catch {}
    })();
  }, []);

  const persist = async (next) => {
    setItems(next);
    try { await AsyncStorage.setItem(KEY_APPTS, JSON.stringify(next)); } catch {}
  };

  const add = () => {
    if (!when.trim()) { Alert.alert("Please enter a date/time"); return; }
    const appt = {
      id: Date.now().toString(),
      when,
      where: where || OFFICE_ADDR,
      note,
      status: "Requested",
    };
    const next = [appt, ...items];
    persist(next);
    setWhen(""); setWhere(""); setNote("");
    Alert.alert("Appointment requested");
  };

  const remove = (id) => persist(items.filter((i) => i.id !== id));

  const addToCalendar = (item) => {
    // Open Google Calendar pre-filled (works on web & Android)
    const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
    const text = encodeURIComponent("Parsons Pest Control Appointment");
    const details = encodeURIComponent(
      `Appointment: ${item.when}\nAddress: ${item.where}\nNotes: ${item.note || ""}`
    );
    const location = encodeURIComponent(item.where);
    const url = `${base}&text=${text}&details=${details}&location=${location}`;
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <PageHeading title="Book Appointment" subtitle="Saved on-device for this demo; calendar link available." />
      <Card>
        <TextInput placeholder="Date & time (e.g., Oct 15, 2–4 PM)" placeholderTextColor="#8BA18B"
          value={when} onChangeText={setWhen} style={styles.input} />
        <TextInput placeholder="Service address (optional)" placeholderTextColor="#8BA18B"
          value={where} onChangeText={setWhere} style={styles.input} />
        <TextInput placeholder="Notes for technician (optional)" placeholderTextColor="#8BA18B"
          value={note} onChangeText={setNote} style={[styles.input, { height: 80 }]} multiline />
        <Button label="Request Appointment" onPress={add} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Your Appointments</Text>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={styles.apptItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.apptWhen}>{item.when}</Text>
                <Text style={styles.apptWhere}>{item.where}</Text>
                {item.note ? <Text style={styles.apptNote}>{item.note}</Text> : null}
                <Text style={styles.apptStatus}>Status: {item.status}</Text>
              </View>
              <View style={{ gap: 6 }}>
                <TouchableOpacity onPress={() => addToCalendar(item)} style={styles.smallBtn}>
                  <Text style={styles.smallBtnText}>Add to Calendar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => remove(item.id)} style={[styles.smallBtn, { backgroundColor: "#2A2424", borderColor: "#5a3a3a" }]}>
                  <Text style={[styles.smallBtnText, { color: "#FFB3B3" }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      </Card>
    </ScrollView>
  );
};

const SupportScreen = ({ navigation }) => {
  const call = () => Linking.openURL(`tel:${PHONE}`);
  const text = () => Linking.openURL(`sms:${PHONE}`);
  const email = () => Linking.openURL(`mailto:${EMAIL}`);
  const directions = () => {
    const url = Platform.OS === "ios"
      ? `http://maps.apple.com/?address=${encodeURIComponent(OFFICE_ADDR)}`
      : `geo:0,0?q=${encodeURIComponent(OFFICE_ADDR)}`;
    Linking.openURL(url);
  };
  const signOut = async () => {
    await AsyncStorage.removeItem(KEY_USER);
    Alert.alert("Signed out", "Restart the app to see the sign-in screen again.");
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <PageHeading title="Support" subtitle="Reach our team or get directions." />
      <Card>
        <View style={styles.row}>
          <Button label="Call" onPress={call} />
          <Button label="Text" onPress={text} />
        </View>
        <View style={styles.row}>
          <Button label="Email" onPress={email} />
          <Button label="Directions" onPress={directions} />
        </View>
        <View style={{ height: 8 }} />
        <Button label="Sign Out" onPress={signOut} />
      </Card>
    </ScrollView>
  );
};

/* ===== Root (Auth + Nav) ===== */
function AppStack() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false, animation: "slide_from_right", contentStyle: { backgroundColor: "#0B1A0B" } }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Diagnose" component={DiagnoseScreen} />
      <Stack.Screen name="Appointments" component={AppointmentsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
    </Stack.Navigator>
  );
}

export default function Root() {
  return (
    <NavigationContainer theme={navTheme}>
      <AuthGate>
        <AppStack />
      </AuthGate>
    </NavigationContainer>
  );
}

/* ===== Styles ===== */
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0B1A0B" },

  authRoot: { flex: 1, paddingHorizontal: 14, paddingTop: 18 },
  headerBrand: {
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  brandSmall: { color: "#E8FFE8", fontSize: 12, letterSpacing: 3, opacity: 0.75, textTransform: "uppercase" },
  brandBig: { color: "#E8FFE8", fontSize: 22, fontWeight: "800", marginTop: 2 },

  homeRoot: { flex: 1, paddingHorizontal: 14, paddingTop: 18 },

  heroCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#0F220F", borderRadius: 18, padding: 16, marginTop: 14,
    borderWidth: 1, borderColor: "#183318", shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  heroTitle: { color: "#F4FFF4", fontSize: 22, fontWeight: "800" },
  heroSub: { color: "#9DCAA0", marginTop: 6, lineHeight: 20 },

  grid: { marginTop: 14, gap: 12 },
  feature: { backgroundColor: "#0F220F", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#183318" },
  featureTitle: { color: "#E8FFE8", fontSize: 16, fontWeight: "800" },
  featureSub: { color: "#98C498", marginTop: 2 },
  badge: { backgroundColor: "#1C441C", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: "#2A5A2A" },
  badgeText: { color: "#E8FFE8", fontWeight: "800" },

  screen: { flex: 1, backgroundColor: "#0B1A0B", paddingHorizontal: 12 },
  card: {
    backgroundColor: "#0F220F", borderRadius: 16, padding: 14, marginTop: 12,
    borderWidth: 1, borderColor: "#183318", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },

  pageTitle: { color: "#F4FFF4", fontSize: 20, fontWeight: "800" },
  pageSub: { color: "#9DCAA0", marginTop: 6, lineHeight: 20 },

  row: { flexDirection: "row", gap: 8, marginVertical: 6 },
  button: { backgroundColor: "#1C441C", borderRadius: 12, paddingVertical: 12, alignItems: "center", flex: 1 },
  buttonText: { color: "#E8FFE8", fontWeight: "800" },

  input: { backgroundColor: "#0B1A0B", borderWidth: 1, borderColor: "#183318", borderRadius: 12, padding: 12, color: "#E8FFE8", marginBottom: 10 },

  photo: { width: "100%", height: 220, borderRadius: 12, marginBottom: 10, backgroundColor: "#0B1A0B" },
  photoPlaceholder: {
    height: 160, borderRadius: 12, backgroundColor: "#0B1A0B",
    borderWidth: 1, borderColor: "#183318", alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  photoPlaceholderText: { color: "#98C498" },

  resultBox: { backgroundColor: "#0B1A0B", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "#183318", marginTop: 8, marginBottom: 10 },
  resultMain: { color: "#E8FFE8", fontWeight: "800", fontSize: 16 },
  resultTip: { color: "#98C498", marginTop: 4 },

  apptItem: {
    backgroundColor: "#0B1A0B", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "#183318",
    flexDirection: "row", gap: 8,
  },
  apptWhen: { color: "#E8FFE8", fontWeight: "800" },
  apptWhere: { color: "#CFE9CF", marginTop: 2 },
  apptNote: { color: "#98C498", marginTop: 2 },
  apptStatus: { color: "#BFEABF", marginTop: 6, fontStyle: "italic" },
  smallBtn: { backgroundColor: "#1C441C", borderColor: "#2A5A2A", borderWidth: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, alignItems: "center" },
});
