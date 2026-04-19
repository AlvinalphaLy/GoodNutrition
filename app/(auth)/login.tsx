import { useState } from "react";
import {
  Pressable,
  View,
  Alert,
  Text,
  StyleSheet,
  TextInput,
} from "react-native";
import { Link } from "expo-router";

import { supabase } from "../lib/supabase";
import { colors } from "../lib/colors";

type TextFieldsProps = {
  email: string;
  setEmail: (text: string) => void;
  password: string;
  setPassword: (text: string) => void;
};

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function logInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  return (
    <View style={[styles.center, { flex: 1 }]}>
      <Text style={styles.h1}>Welcome Back</Text>
      <Text style={[styles.subText, { marginBottom: 10 }]}>
        Enter your email and password
      </Text>
      <TextFields
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
      />
      <View style={{ alignItems: "flex-end", width: 350, marginTop: 5 }}>
        <Link href="../(auth)/forgotPassword" style={styles.link}>
          Forgot password
        </Link>
      </View>
      <View style={{ width: 350, margin: 20 }}>
        <Pressable
          style={[styles.btn, loading && styles.buttonDisabled]}
          onPress={() => logInWithEmail()}
          disabled={loading}
        >
          <Text style={styles.btnText}>Log in</Text>
        </Pressable>
      </View>
      <Separator />
      <View style={[{ margin: 20 }]}>
        <Text style={styles.subText}>
          Don’t have an account?{" "}
          <Link href="../(auth)/signup" style={styles.link}>
            Sign up
          </Link>
        </Text>
      </View>
    </View>
  );
}

const TextFields = ({
  email,
  setEmail,
  password,
  setPassword,
}: TextFieldsProps) => {
  return (
    <View>
      <TextInput
        value={email}
        onChangeText={(text) => setEmail(text)}
        style={styles.input}
        placeholder="Email"
        autoCorrect={false}
        autoCapitalize="none"
      ></TextInput>
      <TextInput
        value={password}
        onChangeText={(text) => setPassword(text)}
        style={styles.input}
        placeholder="Password"
        secureTextEntry={true}
        autoCapitalize="none"
      ></TextInput>
    </View>
  );
};

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  h1: {
    fontSize: 55,
    fontWeight: "bold",
  },
  input: {
    height: 40,
    width: 350,
    margin: 12,
    borderWidth: 1,
    borderColor: colors.textMedium,
    borderRadius: 8,
    padding: 10,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 4,
  },
  btnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "500",
  },
  separator: {
    borderBottomColor: colors.textMedium,
    borderBottomWidth: StyleSheet.hairlineWidth,
    width: "80%",
  },
  link: {
    color: colors.info,
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  logo: {
    fontSize: 50,
  },
  subText: {
    color: colors.textMedium,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
