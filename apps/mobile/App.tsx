import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import CreateProfileScreen from './src/screens/CreateProfileScreen';
import MainTabs from './src/navigation/MainTabs';
import MessagesScreen from './src/screens/MessagesScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Messages" component={MessagesScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
