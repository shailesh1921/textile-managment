import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { 
  Crown, UserCheck, LayoutDashboard, ClipboardList, 
  Activity, CheckSquare, DollarSign 
} from 'lucide-react-native';

import { OwnerCockpitScreen } from '../screens/owner/OwnerCockpitScreen';
import { StaffEntryScreen } from '../screens/staff/StaffEntryScreen';
import { DashboardScreen } from '../screens/admin/DashboardScreen';
import { JobOrdersScreen } from '../screens/admin/JobOrdersScreen';
import { ProductionScreen } from '../screens/admin/ProductionScreen';
import { QualityControlScreen } from '../screens/admin/QualityControlScreen';
import { FinanceScreen } from '../screens/admin/FinanceScreen';

import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  const { t } = useLanguage();
  const { activeRole } = useAuth();

  return (
    <Tab.Navigator
      initialRouteName={activeRole === 'OWNER' ? 'Owner' : activeRole === 'STAFF' ? 'Staff' : 'Dashboard'}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Owner"
        component={OwnerCockpitScreen}
        options={{
          tabBarLabel: t('tab_owner'),
          tabBarIcon: ({ color, size }) => <Crown size={size - 2} color={color} />,
          tabBarActiveTintColor: COLORS.owner,
        }}
      />

      <Tab.Screen
        name="Staff"
        component={StaffEntryScreen}
        options={{
          tabBarLabel: t('tab_staff'),
          tabBarIcon: ({ color, size }) => <UserCheck size={size - 2} color={color} />,
          tabBarActiveTintColor: COLORS.staff,
        }}
      />

      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: t('tab_dashboard'),
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size - 2} color={color} />,
        }}
      />

      <Tab.Screen
        name="Jobs"
        component={JobOrdersScreen}
        options={{
          tabBarLabel: t('tab_jobs'),
          tabBarIcon: ({ color, size }) => <ClipboardList size={size - 2} color={color} />,
        }}
      />

      <Tab.Screen
        name="Production"
        component={ProductionScreen}
        options={{
          tabBarLabel: t('tab_production'),
          tabBarIcon: ({ color, size }) => <Activity size={size - 2} color={color} />,
        }}
      />

      <Tab.Screen
        name="QC"
        component={QualityControlScreen}
        options={{
          tabBarLabel: t('tab_qc'),
          tabBarIcon: ({ color, size }) => <CheckSquare size={size - 2} color={color} />,
        }}
      />

      <Tab.Screen
        name="Finance"
        component={FinanceScreen}
        options={{
          tabBarLabel: t('tab_finance'),
          tabBarIcon: ({ color, size }) => <DollarSign size={size - 2} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
