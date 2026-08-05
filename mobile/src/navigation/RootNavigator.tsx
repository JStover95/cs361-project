import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthScreen } from "../screens/AuthScreen";
import { TodayScreen } from "../screens/TodayScreen";

export type RootStackParamList = {
  Auth: undefined;
  Today: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Auth"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Auth">
          {({ navigation }) => (
            <AuthScreen
              onLoginSuccess={() =>
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Today" }],
                })
              }
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Today">
          {({ navigation }) => (
            <TodayScreen
              onLogout={() =>
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Auth" }],
                })
              }
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
