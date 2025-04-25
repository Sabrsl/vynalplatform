module.exports = {
  ci: {
    collect: {
      staticDistDir: './.next',
      startServerCommand: 'npm run start:prod',
      url: ['http://localhost:3000/'],
      numberOfRuns: 3,
    },
    upload: {
      target: 'temporary-public-storage',
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'interactive': ['warn', { maxNumericValue: 3500 }],
        'max-potential-fid': ['warn', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'uses-responsive-images': 'off', // Désactiver cette assertion si nécessaire
        'uses-rel-preconnect': 'off', // Désactiver cette assertion si nécessaire
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
      },
    },
  },
}; 