// App.js (Snack-ready)
// Deps to add in Snack:
// @react-navigation/native
// @react-navigation/native-stack
// react-native-screens
// react-native-safe-area-context
// expo-status-bar
// expo-image-picker
// @react-native-async-storage/async-storage

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  FlatList,
  Alert,
  Platform,
  Linking,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// ---------- Config ----------
const PHONE = "+12052020818";
const EMAIL = "info@parsonspestdetectives.com";
const OFFICE_ADDR = "13040 Fisher Circle, McCalla, AL";
const KEY_APPTS = "@ppd_appointments";

// React Navigation theme (dark-ish but minimal)
const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "#0B1A0B" },
};

const Stack = createNativeStackNavigator();

// ---------- Reusable UI ----------
const Button = ({ label, onPress, style: styleOverride }) => (
  <TouchableOpacity onPress={onPress} style={[styles.button, styleOverride]}>
    <Text style={styles.buttonText}>{label}</Text>
  </TouchableOpacity>
);

const Card = ({ children, fill }) => (
  <View style={[fill ? styles.cardFill : styles.card]}>{children}</View>
);

const HeaderBrand = () => (
  <View style={styles.headerBrand}>
    <Text style={styles.brandTop}>Parsons</Text>
    <Text style={styles.brandBottom}>Pest Detectives</Text>
  </View>
);

// ---------- Screens ----------
const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <HeaderBrand />
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Protect Your Home</Text>
        <Text style={styles.heroSub}>
          Fast diagnostics, easy scheduling, and direct support—right here.
        </Text>
      </View>

      <View style={styles.homeGrid}>
        <HomeTile
          title="Diagnose a Pest"
          subtitle="Snap or upload a photo"
          onPress={() => navigation.navigate("Diagnose")}
        />
        <HomeTile
          title="Book Appointment"
          subtitle="Pick a time, add notes"
          onPress={() => navigation.navigate("Appointments")}
        />
        <HomeTile
          title="Support"
          subtitle="Call, text, email, directions"
          onPress={() => navigation.navigate("Support")}
        />
      </View>
    </View>
  );
};

const HomeTile = ({ title, subtitle, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.tile}>
    <Text style={styles.tileTitle}>{title}</Text>
    <Text style={styles.tileSub}>{subtitle}</Text>
  </TouchableOpacity>
);

const DiagnoseScreen = () => {
  const [imageUri, setImageUri] = useState(null);
  const [result, setResult] = useState(null);
  const [note, setNote] = useState("");

  const requestPerms = async (type) => {
    if (Platform.OS === "web") return true;
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
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <HeaderBrand />
      <Card>
        <Text style={styles.cardTitle}>Diagnose a Pest</Text>
        <Text style={styles.cardSub}>
          Take or upload a photo. We’ll suggest a likely match. A technician confirms on-site.
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
              Tip: Keep kids/pets away and avoid disturbing the area.
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
    // TODO: send to backend later
    // sendAppointmentToServer(appt)
  };

  const remove = (id) => {
    const next = items.filter((i) => i.id !== id);
    persist(next);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <HeaderBrand />
      <Card>
        <Text style={styles.cardTitle}>Book an Appointment</Text>
        <Text style={styles.cardSub}>
          Stored locally for this demo. We’ll wire this to a backend later.
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
      </Card>
    </ScrollView>
  );
};

const SupportScreen = () => {
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
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <HeaderBrand />
      <Card>
        <Text style={styles.cardTitle}>Support</Text>
        <Text style={styles.cardSub}>Reach our team or get directions.</Text>
        <View style={styles.row}>
          <Button label="Call" onPress={call} />
          <Button label="Text" onPress={text} />
        </View>
        <View style={styles.row}>
          <Button label="Email" onPress={email} />
          <Button label="Directions" onPress={directions} />
        </View>
      </Card>
    </ScrollView>
  );
};

// ---------- App Root / Navigation ----------
export default function Root() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right", // slide-in from the right
          contentStyle: { backgroundColor: "#0B1A0B" },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Diagnose" component={DiagnoseScreen} />
        <Stack.Screen name="Appointments" component={AppointmentsScreen} />
        <Stack.Screen name="Support" component={SupportScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B1A0B", paddingHorizontal: 12 },
  headerBrand: {
    alignItems: "center",
    paddingTop: 22,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  brandTop: {
    color: "#E8FFE8",
    fontSize: 13,
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
  hero: { paddingVertical: 18 },
  heroTitle: { color: "#E8FFE8", fontSize: 22, fontWeight: "800" },
  heroSub: { color: "#9DCAA0", marginTop: 6, lineHeight: 20 },

  homeGrid: { gap: 12, marginTop: 6 },
  tile: {
    backgroundColor: "#0F220F",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#183318",
  },
  tileTitle: { color: "#E8FFE8", fontSize: 18, fontWeight: "800" },
  tileSub: { color: "#98C498", marginTop: 4 },

  screen: { flex: 1, backgroundColor: "#0B1A0B", paddingHorizontal: 12 },
  card: {
    backgroundColor: "#0F220F",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 12,
  },
  cardFill: {
    backgroundColor: "#0F220F",
    borderRadius: 16,
    padding: 6,
    flex: 1,
    overflow: "hidden",
    marginTop: 12,
  },
  cardTitle: { color: "#E8FFE8", fontSize: 18, fontWeight: "800" },
  cardSub: { color: "#98C498", marginTop: 4, marginBottom: 10, lineHeight: 20 },

  row: { flexDirection: "row", gap: 8, marginVertical: 6 },

  button: {
    backgroundColor: "#1C441C",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    flex: 1,
  },
  buttonText: { color: "#E8FFE8", fontWeight: "800" },

  input: {
    backgroundColor: "#0B1A0B",
    borderWidth: 1,
    borderColor: "#183318",
    borderRadius: 12,
    padding: 12,
    color: "#E8FFE8",
    marginBottom: 10,
  },

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
});
