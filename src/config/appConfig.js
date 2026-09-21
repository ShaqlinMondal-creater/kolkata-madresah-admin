/**
 * Single source of truth for theme + site content.
 * Import from here across the app — do not hardcode colors/text in components.
 */

import headerImage from '@/assets/images/header.jpg'
import logoImage from '@/assets/images/logo.png'

export const theme = {
  colors: {
    ink: '#14231c',
    inkSoft: '#3d5348',
    paper: '#f7f3ea',
    paperSoft: '#fffdf8',
    paperDeep: '#efe8d8',
    panel: '#0f2a22',
    panel2: '#16382e',
    gold: '#c4a35a',
    goldSoft: '#e4cf95',
    goldDeep: '#6f5620',
    goldMuted: '#8a6d2c',
    line: 'rgba(196, 163, 90, 0.35)',
    white: '#ffffff',
    danger: '#b42318',
    dangerText: '#8a241c',
    dangerBg: 'rgba(180, 35, 24, 0.06)',
    dangerBorder: 'rgba(180, 35, 24, 0.18)',
    errorSoft: '#ffb4a9',
  },
  fonts: {
    display: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
    body: "'Outfit', 'Segoe UI', sans-serif",
  },
  layout: {
    brandRatio: 7,
    authRatio: 3,
  },
}

/** Apply CSS custom properties from theme (single color source). */
export function applyTheme() {
  const root = document.documentElement
  const { colors, fonts } = theme

  root.style.setProperty('--ink', colors.ink)
  root.style.setProperty('--ink-soft', colors.inkSoft)
  root.style.setProperty('--paper', colors.paper)
  root.style.setProperty('--paper-soft', colors.paperSoft)
  root.style.setProperty('--paper-deep', colors.paperDeep)
  root.style.setProperty('--panel', colors.panel)
  root.style.setProperty('--panel-2', colors.panel2)
  root.style.setProperty('--gold', colors.gold)
  root.style.setProperty('--gold-soft', colors.goldSoft)
  root.style.setProperty('--gold-deep', colors.goldDeep)
  root.style.setProperty('--gold-muted', colors.goldMuted)
  root.style.setProperty('--line', colors.line)
  root.style.setProperty('--white', colors.white)
  root.style.setProperty('--danger', colors.danger)
  root.style.setProperty('--danger-text', colors.dangerText)
  root.style.setProperty('--danger-bg', colors.dangerBg)
  root.style.setProperty('--danger-border', colors.dangerBorder)
  root.style.setProperty('--error-soft', colors.errorSoft)
  root.style.setProperty('--font-display', fonts.display)
  root.style.setProperty('--font-body', fonts.body)
}

export const site = {
  name: 'KolkataMadresah.com',
  society: 'The Madresah Tayebiyah Society',
  url: 'https://kolkatamadresah.com',
  contactEmail: 'madresah@sgjskolkata.com',
  // Local assets (downloaded from main/admin sites)
  headerImage,
  logoImage,
  favicon: '/favicon.ico',
  studentLogin: 'https://kolkatamadresah.com/new_mis/student/student_login.php',
  admissionForm:
    'https://docs.google.com/forms/d/e/1FAIpQLScgI09Fx9KKkyMGv_LDV-nIjvZC3gBpY_Y5DkoDg3P8rxqCPQ/viewform',
  copyrightOwner: 'The Madresah Tayebiyah Society',
}

export function getCopyrightText(year = new Date().getFullYear()) {
  return `© ${year} ${site.copyrightOwner}. All rights reserved.`
}

export const navLinks = [
  {
    type: 'internal',
    to: '/fee-payment-instructions',
    label: 'Fee Payment Instructions',
  },
  {
    type: 'external',
    href: site.admissionForm,
    label: "Ba'ad as Zohar (Afternoon) Madresah Admission Form",
  },
  { type: 'internal', to: '/about-us', label: 'About Us' },
  { type: 'internal', to: '/contact-us', label: 'Contact Us' },
  { type: 'internal', to: '/privacy-policy', label: 'Privacy Policy' },
]

export const footerLinks = [
  { to: '/', label: 'Home' },
  { to: '/about-us', label: 'About Us' },
  { to: '/contact-us', label: 'Contact Us' },
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/fee-payment-instructions', label: 'Fee Instructions' },
]

export const content = {
  home: {
    kicker: site.name,
    title: site.society,
    leadBeforeSup: 'Run under the auspices of Attalim, the Education Administration of His Holiness Syedna Mufaddal Saifuddin Saheb',
    leadSup: 'TUS',
    queriesPrefix: 'If you have any queries, please contact us at',
  },

  login: {
    eyebrow: 'Admin Portal',
    title: 'Sign in',
    subtitle: 'Kolkata Madresah administration',
    usernameLabel: 'Username',
    usernamePlaceholder: 'Enter username',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password',
    submitLabel: 'Login',
    loadingLabel: 'Signing in…',
    emptyError: 'Please enter username and password.',
    invalidError: 'Incorrect username or password.',
    adminOnlyError: 'This portal is for administrators only. Use Pay Fees below.',
    networkError: 'Unable to reach the login server. Please try again.',
    switchToStudent: 'Pay Fees',
    switchToAdmin: 'Admin',
  },

  studentLogin: {
    eyebrow: 'Fee Payment',
    title: 'Pay Fees',
    subtitle: 'Sign in with Roll No to pay and view fees',
    usernameLabel: 'Roll No',
    usernamePlaceholder: 'Enter roll number',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password',
    submitLabel: 'Login',
    loadingLabel: 'Signing in…',
    emptyError: 'Please enter roll number and password.',
    invalidError: 'Incorrect roll number or password.',
    studentOnlyError: 'This login is for fee payment only. Use Admin login.',
    networkError: 'Unable to reach the login server. Please try again.',
  },

  about: {
    title: 'About Us',
    paragraphs: [
      'The Madresah Tayebiyah Society was created by His Holiness Dr Syedna Taher Saifuddin Saheb (RA) for imparting religious education to the children of the Dawoodi Bohra community of Kolkata.',
      'The institution was then run for over 50 years under the aegis of His Holiness Dr Syedna Mohammed Burhanuddin (RA) and is currently run by His Holiness Dr Syedna Mufaddal Saifuddin Saheb (TUS) through Attalim, the Education Administration of His Holiness.',
      'The institution currently has 4 teaching centers - Burhani Masjid (Topsia), Saifee Golden Jubilee School, Chandni Chowk, and Howrah.',
    ],
  },

  contact: {
    title: 'Contact Us',
    org: site.society,
    addressLines: ['9 Park Lane', 'Kolkata 700016'],
    phone: '2229 8684 / 2229 7549',
    labels: {
      address: 'Address',
      email: 'Email',
      phone: 'Phone',
    },
  },

  privacy: {
    title: 'Privacy Policy',
    intro: 'This portal (kolkatamadresah.com) only stores the following information:',
    items: [
      'Information provided by the parent to the school (through the portal and otherwise) pertaining to their child - Name, Age, Gender, Address, Contact Info, etc.',
      'Fee information related to the child.',
    ],
    closing:
      "The portal DOES NOT collect or store any financial information entered by the parents such as credit card / debit card info, net banking details, OTPs, etc. Any such information is entered by the parent directly on ICICI's RazorPay payment gateway. The Madresah Tayebiyah Society, or it's staff, or the developers of this portal are not responsible for any loss or misuse of this information.",
  },

  fees: {
    title: 'Fee Payment Instructions',
    greeting: 'Dear Parents',
    intro:
      "We are happy to inform you that we have launched a Student Management System which will allow you to pay your child's madresah fees using a variety of online options such as Debit Card, Credit Card, Net Banking, UPI, PayTM, Google Pay, etc.",
    firstAccessHeading:
      'To access the Student Management System for the first time, please follow the below steps:',
    defaultPassword: 'Ag=y7df2',
    madresahCodesTitle: 'Madresah Codes',
    madresahCodes: [
      { code: 'BM', name: 'Burhani Masjid' },
      { code: 'CH', name: 'Chandni' },
      { code: 'HW', name: 'Howrah' },
      { code: 'SH', name: 'Saifee Hall' },
    ],
    firstAccessSteps: [
      {
        title: "Obtain Your Child's Roll Number and Password",
        body:
          'Your child\'s Roll No is a combination of the Madresah Code and your child\'s ITS ID. Therefore, if your child is studying in Burhani Masjid and his ITS ID is "77777777", then his Roll No is "BM-77777777".',
        showCodes: true,
        passwordNote:
          'The default password is {password}. (Password is case-sensitive. You can change this password after logging in)',
      },
      {
        title: 'Login',
        bodyBeforeLink: 'Go to the',
        linkLabel: 'Login page',
        bodyAfterLink: "and enter your child's Roll No and Password to login.",
      },
    ],
    afterLoginHeading:
      'After logging in to the Student Management System, follow the below steps to pay the fees:',
    paySteps: [
      {
        title: 'Click on "Pending Fees"',
        body: 'You will see the months for which the fees are due.',
      },
      {
        title: 'Select the months for which you are paying the fees',
        body: 'You will not be able to select a month unless the fees for the previous months are paid.',
      },
      {
        title: 'Click on the "Pay" button at the bottom of the page',
        body: 'You will be taken to the next page where you will see a disclaimer and other information.',
      },
      {
        title: 'Click on the "Pay Now" button',
        body: 'The ICICI RazorPay popup will load where you are required to enter your payment information.',
      },
      {
        title: 'Follow the instructions on the screen and complete the payment',
        bodyWithEmail: true,
        bodyBeforeEmail: 'If you have any questions, you can contact us at',
      },
    ],
    noteTitle: 'Note:',
    noteBody:
      'Your financial information (Credit Card number, Debit Card number, Net Banking Username, Password, PIN, OTP, Google Pay details, PayTM details, UPI details, etc) will be entered by you directly on the RazorPay (ICICI) popup page. At no point of time does The Madresah Tayebiyah Society or the website developer come in possession of this information, and hence is not liable for the misuse (if any) of this information.',
  },
}
