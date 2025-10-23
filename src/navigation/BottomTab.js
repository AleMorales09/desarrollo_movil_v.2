import Ionicons from 'react-native-vector-icons/Ionicons';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../../screens/Home';
import SignUp from '../../screens/SignUp';

const Tab = createBottomTabNavigator();

export const BottomTab = () => {
    return(
        <Tab.Navigator>
            <Tab.Screen name='Home' component={Home} />
            <Tab.Screen name='SignUp' component={SignUp} />
        </Tab.Navigator>
    );
};

