import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthScreen } from "../screens/AuthScreen";
import { MatrixScreen } from "../screens/MatrixScreen";
import { TodayScreen } from "../screens/TodayScreen";

export type RootStackParamList = {
  Auth: undefined;
  Today: undefined;
  Matrix: undefined;
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
              onViewMatrix={() => navigation.navigate("Matrix")}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Matrix">
          {({ navigation }) => (
            <MatrixScreen onClose={() => navigation.goBack()} />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
