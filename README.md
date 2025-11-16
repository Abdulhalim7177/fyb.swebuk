# Swebuk

Swebuk (Software Engineering Student Club) is an online tech community designed to connect software engineering students across various academic levels. It provides a digital environment for collaboration, project management, club (cluster) participation, event registration, blogging, and professional portfolio building. The system also offers administrative tools for staff to manage students, clusters, events, and projects efficiently.

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/swebuk.git
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up environment variables:**
   - Rename `.env.example` to `.env.local`.
   - Fill in the required Supabase credentials.
   - Add the `SUPABASE_SERVICE_ROLE_KEY` to enable admin operations (user management, etc.).
4. **Run the development server:**
   ```bash
   npm run dev
   ```

## Environment Variables

To run this project, you will need to add the following environment variables to your `.env.local` file:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Your Supabase publishable key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (required for admin operations)

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.