/*
 * Copyright (c) 2026 FalkenDev
 *
 * This file is part of Grindify.
 *
 * Grindify is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with Grindify. If not, see
 * <https://www.gnu.org/licenses/>.
 */

/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import '@/styles/legacy-reset.css'
import '@/styles/legacy-typography.scss'
import '@/styles/legacy-grid.css'

// Composables
import { createVuetify } from 'vuetify'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  // Vuetify 4 lowered the md/lg/xl/xxl breakpoints; keep the Vuetify 3 values
  // (matching $grid-breakpoints in styles/settings.scss).
  display: {
    thresholds: {
      md: 960,
      lg: 1280,
      xl: 1920,
      xxl: 2560,
    },
  },
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          primary: '#ABFF1A',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#FF0000',
          textPrimary: '#FFFFFF',
          textSecondary: '#A1A1A1',
          cardBg: '#15181E',
          background: '#0C0E12',
          iconBackground: '#304d00ff',
          borderColor: '#474747',
          weekDayBg: '#242424',
          avatarBg: '#3d462d',
        },
      },
      light: {
        dark: false,
        colors: {
          primary: '#4CAF50',
          secondary: '#607D8B',
          accent: '#2196F3',
          error: '#E53935',
          textPrimary: '#212121',
          textSecondary: '#757575',
          cardBg: '#FFFFFF',
          background: '#EAEDED',
          iconBackground: '#E8F5E9',
          borderColor: '#D5D8DC',
          weekDayBg: '#F5F5F5',
          avatarBg: '#C8E6C9',
        },
      },
    },
  },
  defaults: {
    VBtn: {
      density: 'compact',
      height: '40px',
    },
    VBtnToggle: {
      density: 'compact',
    },
    VAlert: {
      density: 'compact',
    },
    VBanner: {
      density: 'compact',
    },
    VTextField: {},
    VTextarea: {
      density: 'compact',
    },
    VSelect: {
      density: 'compact',
    },
    VAutocomplete: {
      density: 'compact',
    },
    VCombobox: {
      density: 'compact',
      delimiters: [','],
    },
    VFileInput: {
      density: 'compact',
    },
    VCheckbox: {
      density: 'compact',
    },
    VRadio: {
      density: 'compact',
    },
    VRadioGroup: {
      density: 'compact',
    },
    VSwitch: {
      density: 'compact',
    },
    VSlider: {
      density: 'compact',
    },
    VRangeSlider: {
      density: 'compact',
    },
    VToolbar: {
      density: 'compact',
    },
    VDialog: {
      scrollStrategy: 'block',
    },
    VTabs: {
      density: 'compact',
    },
    VBreadcrumbs: {
      density: 'compact',
    },
    VPagination: {
      density: 'compact',
    },
    VDataTable: {
      density: 'compact',
    },
    VDataTableServer: {
      density: 'compact',
    },
    VTimeline: {
      density: 'compact',
    },
    VTimelineItem: {},
    VAvatar: {
      density: 'compact',
    },
    VRating: {
      density: 'compact',
    },
  },
})
