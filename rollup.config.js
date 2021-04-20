import dotenv from 'dotenv'
import clear from 'rollup-plugin-clear'
import screeps from 'rollup-plugin-screeps'
import typescript2 from 'rollup-plugin-typescript2'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'

const {error} = dotenv.config({
  path: '.env.local'
})

if(error) {
  console.error(error)
}

console.log(process.env.TARGET)

const isDeploy = process.env.TARGET === 'deploy'

export default {
  input: 'src/main.ts',
  output: {
    file: 'dist/main.js',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    clear({targets: ['dist']}),
    resolve(),
    commonjs(),
    typescript2(),
    isDeploy && screeps({
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
  ].filter(Boolean)
}