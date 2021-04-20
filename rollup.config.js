import dotenv from 'dotenv'
import clear from 'rollup-plugin-clear'
import screeps from 'rollup-plugin-screeps'

const {error} = dotenv.config({
  path: '.env.local'
})

if(error) {
  console.log(error)
}

console.log(process.env.SECRET)

export default {
  input: 'src/main.ts',
  output: {
    file: 'dist/main.js',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    clear({targets: ['dist']}),
    screeps({
      config: {
        token: process.env.TOKEN,
        protocol: process.env.PROTOCOL || 'https',
        hostname: process.env.HOSTNAME || 'screeps.com',
        port: parseInt(process.env.PORT) || 443,
        path: '/',
        branch: process.env.BRANCH || 'auto'
      },
      dryRun: false
    })
  ]
}