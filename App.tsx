import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { WebView } from "react-native-webview";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* -------- Config (can be wired to real backend later) -------- */
const SITE_URL = "https://www.parsonspestdetectives.com/";
const PHONE = "+12052020818";
const EMAIL = "info@parsonspestdetectives.com";
const OFFICE_ADDR = "13040 Fisher Circle, McCalla, AL";

const TABS = ["Website", "Diagnose", "Appointments", "Support"];
const KEY_APPTS = "@ppd_appointments";

export default function App() {
  const [tab, setTab] = useState("Website");
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Header />
      <View style={styles.content}>
        {tab === "Website" && <Website />}
        {tab === "Diagnose" && <Diagnose />}
        {tab === "Appointments" && <Appointments />}
        {tab === "Support" && <Support />}
      </View>
      <Tabs tab={tab} setTab={setTab} />
    </View>
  );
}

/* ---------------------- Header ---------------------- */
function Header() {
  const build = Constants?.expoConfig?.version ?? "1.0.0";
  return (
    <View style={styles.header}>
      <Text style={styles.brandTop}>Parsons</Text>
      <Text style={styles.brandBottom}>Pest Detectives</Text>
      <Text style={styles.buildTag}>v{build}</Text>
    </View>
  );
}

/* ----------------------- Tabs ----------------------- */
function Tabs({ tab, setTab }) {
  return (
    <View style={styles.tabs}>
      {TABS.map((t) => (
        <TouchableOpacity
          key={t}
          onPress={() => setTab(t)}
          style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
            {t}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* -------------------- Website tab ------------------- */
function Website() {
  const webRef = useRef(null);
  const [loading, setLoading] = useState(true);
  return (
    <View style={styles.cardFill}>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" />
          <Text style={styles.loaderText}>Loading…</Text>
        </View>
      )}
      <WebView
        ref={webRef}
        source={{ uri: SITE_URL }}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled
        domStorageEnabled
        style={{ flex: 1, borderRadius: 16 }}
        onShouldStartLoadWithRequest={(event) => {
          const url = event.url;
          if (
            url.startsWith("tel:") ||
            url.startsWith("mailto:") ||
            url.startsWith("sms:")
          ) {
            Linking.openURL(url);
            return false;
          }
          return true;
        }}
      />
    </View>
  );
}

/* -------------------- Diagnose tab ------------------ */
function Diagnose() {
  const [imageUri, setImageUri] = useState(null);
  const [result, setResult] = useState(null);
  const [note, setNote] = useState("");

  const requestPerms = async (type) => {
    if (Platform.OS === "web") return true; // Snack web: no prompt
    const fn =
      type === "camera"
        ? ImagePicker.requestCameraPermissionsAsync
        : ImagePicker.requestMediaLibraryPermissionsAsync;
    const { granted } = await fn();
    return granted;
  };

  const pickImage = async (fromCamera) => {
    const ok = await requestPerms(fromCamera ? "camera" : "library");
    if (!ok) {
      Alert.alert("Permission needed", "Please allow access to continue.");
      return;
    }
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, base64: false })
      : await ImagePicker.launchImageLibraryAsync({
          quality: 0.7,
          base64: false,
        });
    if (!res.canceled) {
      setImageUri(res.assets[0].uri);
      setResult(null);
    }
  };

  // Mock classifier (replace with real API later)
  const identify = () => {
    if (!imageUri) {
      Alert.alert("Add a photo first");
      return;
    }
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
    <ScrollView contentContainerStyle={styles.scrollPad}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Diagnose a Pest</Text>
        <Text style={styles.cardSub}>
          Snap or upload a photo. We’ll suggest a likely match. A technician
          confirms on-site.
        </Text>

        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>No photo yet</Text>
          </View>
        )}

        <View style={styles.row}>
          <Button label="Take Photo" onPress={() => pickImage(true)} />
          <Button label="Upload" onPress={() => pickImage(false)} />
        </View>

        <Button label="Identify Pest" onPress={identify} />

        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultMain}>
              {result.label} • {(result.confidence * 100).toFixed(0)}%
            </Text>
            <Text style={styles.resultTip}>
              Tip: Keep kids/pets away, avoid disturbing the area.
            </Text>
          </View>
        )}

        <TextInput
          placeholder="Add a note (optional)…"
          placeholderTextColor="#8BA18B"
          value={note}
          onChangeText={setNote}
          style={styles.input}
        />
      </View>
    </ScrollView>
  );
}

/* ------------------ Appointments tab ---------------- */
function Appointments() {
  const [when, setWhen] = useState("");
  const [where, setWhere] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(KEY_APPTS);
        if (json) setItems(JSON.parse(json));
      } catch {}
    })();
  }, []);

  const persist = async (next) => {
    setItems(next);
    try {
      await AsyncStorage.setItem(KEY_APPTS, JSON.stringify(next));
    } catch {}
  };

  const add = () => {
    if (!when.trim()) {
      Alert.alert("Please enter a date/time");
      return;
    }
    const appt = {
      id: Date.now().toString(),
      when,
      where: where || OFFICE_ADDR,
      note,
      status: "Requested",
    };
    const next = [appt, ...items];
    persist(next);
    setWhen("");
    setWhere("");
    setNote("");
    Alert.alert("Appointment requested");
  };

  const remove = (id) => {
    const next = items.filter((i) => i.id !== id);
    persist(next);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollPad}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Book an Appointment</Text>
        <Text style={styles.cardSub}>
          This demo saves your requests on-device. Hook up a backend to schedule
          with dispatch.
        </Text>

        <TextInput
          placeholder="Date & time (e.g., Oct 15, 2–4 PM)"
          placeholderTextColor="#8BA18B"
          value={when}
          onChangeText={setWhen}
          style={styles.input}
        />
        <TextInput
          placeholder="Service address (optional)"
          placeholderTextColor="#8BA18B"
          value={where}
          onChangeText={setWhere}
          style={styles.input}
        />
        <TextInput
          placeholder="Notes for technician (optional)"
          placeholderTextColor="#8BA18B"
          value={note}
          onChangeText={setNote}
          style={[styles.input, { height: 80 }]}
          multiline
        />
        <Button label="Request Appointment" onPress={add} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Appointments</Text>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={styles.apptItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.apptWhen}>{item.when}</Text>
                <Text style={styles.apptWhere}>{item.where}</Text>
                {item.note ? (
                  <Text style={styles.apptNote}>{item.note}</Text>
                ) : null}
                <Text style={styles.apptStatus}>Status: {item.status}</Text>
              </View>
              <TouchableOpacity onPress={() => remove(item.id)}>
                <Text style={styles.remove}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      </View>
    </ScrollView>
  );
}

/* --------------------- Support tab ------------------- */
function Support() {
  const call = () => Linking.openURL(`tel:${PHONE}`);
  const text = () => Linking.openURL(`sms:${PHONE}`);
  const email = () => Linking.openURL(`mailto:${EMAIL}`);
  const directions = () => {
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?address=${encodeURIComponent(OFFICE_ADDR)}`
        : `geo:0,0?q=${encodeURIComponent(OFFICE_ADDR)}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Support</Text>
      <Text style={styles.cardSub}>Reach our team or visit the site.</Text>
      <View style={styles.row}>
        <Button label="Call" onPress={call} />
        <Button label="Text" onPress={text} />
      </View>
      <View style={styles.row}>
        <Button label="Email" onPress={email} />
        <Button label="Directions" onPress={directions} />
      </View>
      <Button label="Open Website" onPress={() => Linking.openURL(SITE_URL)} />
    </View>
  );
}

/* ------------------- Reusable Button ----------------- */
function Button({ label, onPress, style: styleOverride }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, styleOverride]}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ------------------------ Styles --------------------- */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B1A0B" },
  header: {
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: "center",
    backgroundColor: "#0B1A0B",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  brandTop: {
    color: "#E8FFE8",
    fontSize: 14,
    letterSpacing: 3,
    opacity: 0.75,
    textTransform: "uppercase",
  },
  brandBottom: {
    color: "#E8FFE8",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
  buildTag: {
    color: "#BFEABF",
    marginTop: 4,
    fontSize: 12,
    opacity: 0.7,
  },
  content: { flex: 1, padding: 12 },
  tabs: {
    flexDirection: "row",
    gap: 6,
    padding: 10,
    backgroundColor: "#0B1A0B",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  tabBtn: {
    flex: 1,
    backgroundColor: "#132D13",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: "#1C441C" },
  tabText: { color: "#BFEABF", fontWeight: "700" },
  tabTextActive: { color: "#E8FFE8" },

  card: {
    backgroundColor: "#0F220F",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 12,
  },
  cardFill: {
    backgroundColor: "#0F220F",
    borderRadius: 16,
    padding: 6,
    flex: 1,
    overflow: "hidden",
  },
  cardTitle: { color: "#E8FFE8", fontSize: 18, fontWeight: "800" },
  cardSub: {
    color: "#98C498",
    marginTop: 4,
    marginBottom: 10,
    lineHeight: 20,
  },

  loader: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  loaderText: { marginTop: 8, color: "#CDE6CD" },

  input: {
    backgroundColor: "#0B1A0B",
    borderWidth: 1,
    borderColor: "#183318",
    borderRadius: 12,
    padding: 12,
    color: "#E8FFE8",
    marginBottom: 10,
  },
  row: { flexDirection: "row", gap: 8, marginVertical: 6 },

  button: {
    backgroundColor: "#1C441C",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    flex: 1,
  },
  buttonText: { color: "#E8FFE8", fontWeight: "800" },

  photo: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#0B1A0B",
  },
  photoPlaceholder: {
    height: 160,
    borderRadius: 12,
    backgroundColor: "#0B1A0B",
    borderWidth: 1,
    borderColor: "#183318",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  photoPlaceholderText: { color: "#98C498" },

  resultBox: {
    backgroundColor: "#0B1A0B",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#183318",
    marginTop: 8,
    marginBottom: 10,
  },
  resultMain: { color: "#E8FFE8", fontWeight: "800", fontSize: 16 },
  resultTip: { color: "#98C498", marginTop: 4 },

  apptItem: {
    backgroundColor: "#0B1A0B",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#183318",
    flexDirection: "row",
    gap: 8,
  },
  apptWhen: { color: "#E8FFE8", fontWeight: "800" },
  apptWhere: { color: "#CFE9CF", marginTop: 2 },
  apptNote: { color: "#98C498", marginTop: 2 },
  apptStatus: { color: "#BFEABF", marginTop: 6, fontStyle: "italic" },
  remove: {
    color: "#FFB3B3",
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },

  scrollPad: { paddingBottom: 24 },
});
