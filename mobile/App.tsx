import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  BackHandler,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import registerRootComponent from 'expo/src/launch/registerRootComponent';

// Default to user's computer LAN IP address on Wi-Fi
const DEFAULT_URL = 'http://192.168.2.181:3000';

export default function App() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_URL);
  const [inputUrl, setInputUrl] = useState(DEFAULT_URL);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // Handle Android hardware back button
  useEffect(() => {
    if (Platform.OS === 'android') {
      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true; // Prevent default back action
        }
        return false;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );
      return () => subscription.remove();
    }
  }, [canGoBack]);

  const handleReload = () => {
    setHasError(false);
    setIsLoading(true);
    setServerUrl(inputUrl.trim());
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" translucent={true} />

      {hasError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorBadge}>PG FLOW MOBILE</Text>
          <Text style={styles.errorTitle}>Unable to Connect to Server</Text>
          <Text style={styles.errorMessage}>
            Could not reach: {serverUrl}
          </Text>

          <View style={styles.hintBox}>
            <Text style={styles.hintTitle}>Make sure on your PC:</Text>
            <Text style={styles.hintItem}>1. Both PC and phone are on the same Wi-Fi.</Text>
            <Text style={styles.hintItem}>2. Backend is running: `npm run dev` in backend</Text>
            <Text style={styles.hintItem}>3. Web app is running: `npm run dev` in mobile</Text>
          </View>

          <Text style={styles.inputLabel}>Server URL (Change if IP differs):</Text>
          <TextInput
            style={styles.input}
            value={inputUrl}
            onChangeText={setInputUrl}
            placeholder="http://192.168.x.x:3000"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
            <Text style={styles.retryButtonText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.webviewContainer}>
          <WebView
            ref={webViewRef}
            source={{ uri: serverUrl }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            allowsInlineMediaPlayback={true}
            mixedContentMode="always"
            onNavigationStateChange={(navState) => {
              setCanGoBack(navState.canGoBack);
            }}
            onError={() => setHasError(true)}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              if (nativeEvent.statusCode >= 400) {
                setHasError(true);
              }
            }}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => {
              setIsLoading(false);
              setHasError(false);
            }}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Loading PG Flow...</Text>
              </View>
            )}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 38) : 0,
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  webview: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#090d16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#090d16',
  },
  errorBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    letterSpacing: 1,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#f43f5e',
    textAlign: 'center',
    marginBottom: 20,
  },
  hintBox: {
    backgroundColor: 'rgba(18, 26, 47, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 24,
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  hintItem: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 15,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

registerRootComponent(App);
