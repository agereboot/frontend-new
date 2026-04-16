This frontend was adjusted to use a compatible CRA + CRACO stack.

What changed:
- react-scripts -> 5.0.1
- @craco/craco -> 7.0.0
- react/react-dom -> 18.2.0
- date-fns -> 3.6.0 (compatible with react-day-picker 8.10.1)
- removed cra-template and extra ESLint packages that can conflict with CRA 5
- copied `dotenv` to `.env` so environment variables load correctly

Commands:
1. npm install
2. npm start
