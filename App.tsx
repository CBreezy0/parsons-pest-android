
import React, { useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Linking, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import WebView from 'react-native-webview';
import Constants from 'expo-constants';

const siteUrl = Constants.expoConfig?.extra?.siteUrl ?? 'https://www.parsonspestdetectives.com/';
const phone = Constants.expoConfig?.extra?.phone ?? '+12052020818';
const email = Constants.expoConfig?.extra?.email ?? 'info@parsonspestdetectives.com';
const address = Constants.expoConfig?.extra?.address ?? '13040 Fisher Circle, McCalla, AL';

export default function App() {
  const webRef = useRef(null);
  const [loading, setLoading] = useState(true);

  const openCall = useCallback(() => Linking.openURL(`tel:${phone}`), []);
  const openText = useCallback(() => Linking.openURL(`sms:${phone}`), []);
  const openEmail = useCallback(() => Linking.openURL(`mailto:${email}`), []);
  const openDirections = useCallback(() => {
    const url = Platform.select({
      ios: `http://maps.apple.com/?address=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`
    });
    if (url) Linking.openURL(url);
  }, []);

  const openBooking = useCallback(() => {
    // If the site has a booking page/anchor, set it here for quick access.
    webRef.current?.injectJavaScript(`window.location.href='${siteUrl}#get-protected'; true;`);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Parsons Pest Detectives</Text>
      </View>

      <View style={styles.webWrap}>
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" />
            <Text style={styles.loaderText}>Loading…</Text>
          </View>
        )}
        <WebView
          ref={webRef}
          source={{ uri: siteUrl }}
          onLoadEnd={() => setLoading(false)}
          startInLoadingState={false}
          javaScriptEnabled
          domStorageEnabled
          style={{ flex: 1 }}
          onShouldStartLoadWithRequest={(event) => {
            const url = event.url;
            if (url.startsWith('tel:') || url.startsWith('mailto:') || url.startsWith('sms:')) {
              Linking.openURL(url);
              return false;
            }
            return true;
          }}
        />
      </View>

      <View style={styles.actionsBar}>
        <ActionButton label="Call" onPress={openCall} />
        <ActionButton label="Text" onPress={openText} />
        <ActionButton label="Email" onPress={openEmail} />
        <ActionButton label="Directions" onPress={openDirections} />
        <ActionButton label="Book" onPress={openBooking} />
      </View>
    </View>
  );
}

function ActionButton({ label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.actionBtn}>
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C1F0C' },
  header: {
    paddingVertical: 12,
    backgroundColor: '#0C1F0C',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: { color: '#E6FFE6', fontSize: 18, fontWeight: '700' },
  webWrap: { flex: 1, backgroundColor: '#fff' },
  loader: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  loaderText: { marginTop: 8, color: '#333' },
  actionsBar: {
    flexDirection: 'row',
    backgroundColor: '#0C1F0C',
    padding: 10,
    justifyContent: 'space-between'
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#1A3A1A',
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center'
  },
  actionText: { color: '#E6FFE6', fontWeight: '700' }
});
