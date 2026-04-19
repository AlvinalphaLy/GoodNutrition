import { Link, router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { supabase } from "../lib/supabase";
import { colors } from "../lib/colors";

type TextFieldsProps = {
  fullName: string;
  setFullName: (text: string) => void;
  email: string;
  setEmail: (text: string) => void;
  password: string;
  setPassword: (text: string) => void;
  confirmPassword: string;
  setConfirmPassword: (text: string) => void;
};

export default function Index() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail() {
    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match");
      return;
    }

    setLoading(true);

    const {
      data: { session }, //wtf is this?
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) Alert.alert(error.message);
    if (!session)
      Alert.alert("Please check your inbox for email verification!");
    setLoading(false);
  }

  return (
    <View style={[styles.center, { flex: 1 }]}>
      <Text style={styles.h1}>Sign up</Text>
      <Text style={[styles.subText, { marginBottom: 10 }]}>
        Sign up to get started
      </Text>
      <TextFields
        fullName={fullName}
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        setFullName={setFullName}
        setEmail={setEmail}
        setPassword={setPassword}
        setConfirmPassword={setConfirmPassword}
      />
      <View style={{ width: 350, margin: 20 }}>
        <Pressable
          style={[styles.btn, loading && styles.buttonDisabled]}
          onPress={() => signUpWithEmail()}
          disabled={loading}
        >
          <Text style={styles.btnText}>Sign up</Text>
        </Pressable>
      </View>
      <Separator />
      <View style={{ margin: 20 }}>
        <Text style={styles.subText}>
          Already have an account?{" "}
          <Link href="/(auth)/login" style={styles.link}>
            Log in
          </Link>
        </Text>
      </View>
    </View>
  );
}

const TextFields = ({
  fullName,
  email,
  password,
  confirmPassword,
  setFullName,
  setEmail,
  setPassword,
  setConfirmPassword,
}: TextFieldsProps) => {
  return (
    <View>
      <TextInput
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
        placeholder="Full Name"
        autoCorrect={false}
      ></TextInput>
      <TextInput
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholder="Email"
        autoCorrect={false}
        autoCapitalize="none"
      ></TextInput>
      <TextInput
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        placeholder="Password"
        secureTextEntry={true}
        autoCapitalize="none"
      ></TextInput>
      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
        placeholder="Confirm Password"
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
  subText: {
    color: colors.textMedium,
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
  buttonDisabled: {
    opacity: 0.5,
  },
});
