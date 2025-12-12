import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Missing Supabase environment variables' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // --- CLEANUP ---
    console.log("Starting cleanup...");
    
    // Delete existing data (order matters due to foreign keys)
    await supabase.from('fyp_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Hack to delete all rows
    await supabase.from('final_year_projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('project_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('project_tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('cluster_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('clusters').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('session_processing_log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('academic_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Delete users (This will cascade to profiles if configured, or we delete profiles manually)
    // Since we can't easily "delete all users" with one command in client lib, 
    // we'll iterate through known seeded emails or just list all users.
    const { data: users, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listError) throw listError;

    const seededEmails = [
      'admin@swebuk.com',
      'staff1@swebuk.com',
      'staff2@swebuk.com',
      'staff3@swebuk.com',
      'student100@swebuk.com',
      'student200@swebuk.com',
      'student300@swebuk.com',
      'student400@swebuk.com',
      'student100_2@swebuk.com',
      'student200_2@swebuk.com',
      'student300_2@swebuk.com',
      'student400_2@swebuk.com',
      'lead1@swebuk.com',
      'lead2@swebuk.com',
      'deputy1@swebuk.com',
      'deputy2@swebuk.com'
    ];

    for (const user of users.users) {
        if (seededEmails.includes(user.email || '')) {
            await supabase.auth.admin.deleteUser(user.id);
        }
    }
    console.log("Cleanup complete.");


    // --- SEEDING ---
    console.log("Starting seeding...");

    const userData: any = {}; // Store created user IDs

    // 1. Create Users
    const usersToCreate = [
      { email: 'admin@swebuk.com', password: 'password', role: 'admin', name: 'System Admin' },
      { email: 'staff1@swebuk.com', password: 'password', role: 'staff', name: 'Dr. Sarah Johnson' },
      { email: 'staff2@swebuk.com', password: 'password', role: 'staff', name: 'Prof. Michael Chen' },
      { email: 'staff3@swebuk.com', password: 'password', role: 'staff', name: 'Dr. Emily Rodriguez' },
      { email: 'student100@swebuk.com', password: 'password', role: 'student', academic_level: 'level_100', name: 'Alex Thompson' },
      { email: 'student200@swebuk.com', password: 'password', role: 'student', academic_level: 'level_200', name: 'Maya Patel' },
      { email: 'student300@swebuk.com', password: 'password', role: 'student', academic_level: 'level_300', name: 'James Wilson' },
      { email: 'student400@swebuk.com', password: 'password', role: 'student', academic_level: 'level_400', name: 'Sophia Martinez' },
      { email: 'student100_2@swebuk.com', password: 'password', role: 'student', academic_level: 'level_100', name: 'Liam Brown' },
      { email: 'student200_2@swebuk.com', password: 'password', role: 'student', academic_level: 'level_200', name: 'Olivia Davis' },
      { email: 'student300_2@swebuk.com', password: 'password', role: 'student', academic_level: 'level_300', name: 'Noah Anderson' },
      { email: 'student400_2@swebuk.com', password: 'password', role: 'student', academic_level: 'level_400', name: 'Emma Taylor' },
      { email: 'lead1@swebuk.com', password: 'password', role: 'student', academic_level: 'level_300', name: 'David Kim' }, // Will be lead
      { email: 'lead2@swebuk.com', password: 'password', role: 'student', academic_level: 'level_300', name: 'Sarah Lee' }, // Will be lead
      { email: 'deputy1@swebuk.com', password: 'password', role: 'student', academic_level: 'level_200', name: 'Ryan Murphy' }, // Will be deputy
      { email: 'deputy2@swebuk.com', password: 'password', role: 'student', academic_level: 'level_200', name: 'Jessica White' }, // Will be deputy
    ];

    for (const u of usersToCreate) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.name }
      });

      if (error) {
        console.error(`Error creating user ${u.email}:`, error);
        continue;
      }

      userData[u.email] = data.user.id;

      // Update Profile with role and academic level
      // Note: Trigger creates profile, we update it.
      const updateData: any = {
        role: u.role,
        full_name: u.name
      };

      // Only set academic_level if it's explicitly provided
      if (u.academic_level) {
        updateData.academic_level = u.academic_level;
      }

      await supabase.from('profiles').update(updateData).eq('id', data.user.id);
    }

    // 2. Create Clusters
    const clustersToCreate = [
        {
            name: 'Web Development',
            description: 'Everything about Web Technologies, Frontend, Backend, and Full-Stack Development',
            lead: userData['lead1@swebuk.com'],
            deputy: userData['deputy1@swebuk.com'],
            staff: userData['staff1@swebuk.com'],
            creator: userData['admin@swebuk.com'],
            members: [userData['student100@swebuk.com'], userData['student200@swebuk.com'], userData['student300_2@swebuk.com']]
        },
        {
            name: 'Artificial Intelligence',
            description: 'AI and Machine Learning enthusiasts exploring the future of technology',
            lead: userData['lead2@swebuk.com'],
            deputy: userData['deputy2@swebuk.com'],
            staff: userData['staff2@swebuk.com'],
            creator: userData['admin@swebuk.com'],
            members: [userData['student300@swebuk.com'], userData['student400_2@swebuk.com'], userData['student200_2@swebuk.com']]
        },
        {
            name: 'Mobile Development',
            description: 'iOS, Android, and Cross-Platform Mobile Application Development',
            lead: userData['student300_2@swebuk.com'],
            deputy: null,
            staff: userData['staff3@swebuk.com'],
            creator: userData['admin@swebuk.com'],
            members: [userData['student100_2@swebuk.com'], userData['student400@swebuk.com']]
        },
        {
            name: 'Cybersecurity',
            description: 'Network Security, Ethical Hacking, and Information Security',
            lead: userData['student300@swebuk.com'],
            deputy: null,
            staff: userData['staff1@swebuk.com'],
            creator: userData['admin@swebuk.com'],
            members: [userData['student200@swebuk.com']]
        }
    ];

    const clusterIds: any = {};

    for (const c of clustersToCreate) {
        const { data, error } = await supabase.from('clusters').insert({
            name: c.name,
            description: c.description,
            lead_id: c.lead,
            deputy_id: c.deputy,
            staff_manager_id: c.staff,
            created_by: c.creator,
            status: 'active'
        }).select().single();

        if (error) console.error(`Error creating cluster ${c.name}:`, error);
        else {
            clusterIds[c.name] = data.id;

            // Add lead and deputy as members
            if(c.lead) await supabase.from('cluster_members').insert({ cluster_id: data.id, user_id: c.lead, role: 'lead', status: 'approved' });
            if(c.deputy) await supabase.from('cluster_members').insert({ cluster_id: data.id, user_id: c.deputy, role: 'deputy', status: 'approved' });

            // Add other members
            for (const memberId of c.members) {
                await supabase.from('cluster_members').insert({ cluster_id: data.id, user_id: memberId, role: 'member', status: 'approved' });
            }
        }
    }

    // 3. Create Projects
    const projectsToCreate = [
        // Web Development Cluster Projects
        {
            name: 'Swebuk Platform',
            description: 'The official community platform for software engineering students. Built with Next.js, TypeScript, and Supabase.',
            type: 'cluster',
            visibility: 'public',
            status: 'active',
            owner_id: userData['lead1@swebuk.com'],
            cluster_id: clusterIds['Web Development'],
            repository_url: 'https://github.com/swebuk/platform',
            demo_url: 'https://swebuk.com',
            tags: ['Next.js', 'TypeScript', 'Supabase', 'Tailwind CSS', 'React'],
            members: [
                { user_id: userData['student200@swebuk.com'], role: 'maintainer' },
                { user_id: userData['student300_2@swebuk.com'], role: 'member' },
                { user_id: userData['deputy1@swebuk.com'], role: 'member' }
            ]
        },
        {
            name: 'E-Commerce Dashboard',
            description: 'Modern admin dashboard for managing online stores with real-time analytics and inventory management.',
            type: 'cluster',
            visibility: 'public',
            status: 'active',
            owner_id: userData['deputy1@swebuk.com'],
            cluster_id: clusterIds['Web Development'],
            repository_url: 'https://github.com/webdev/ecommerce-dashboard',
            tags: ['React', 'Node.js', 'MongoDB', 'Express', 'Chart.js'],
            members: [
                { user_id: userData['student100@swebuk.com'], role: 'member' }
            ]
        },
        {
            name: 'Recipe Sharing Platform',
            description: 'A social platform for food enthusiasts to share and discover recipes.',
            type: 'cluster',
            visibility: 'public',
            status: 'in_progress',
            owner_id: userData['student200@swebuk.com'],
            cluster_id: clusterIds['Web Development'],
            tags: ['Vue.js', 'Firebase', 'Vuetify', 'PWA'],
            members: []
        },

        // AI Cluster Projects
        {
            name: 'Smart Study Assistant',
            description: 'AI-powered study assistant that helps students organize notes, generate quizzes, and track learning progress.',
            type: 'cluster',
            visibility: 'public',
            status: 'active',
            owner_id: userData['lead2@swebuk.com'],
            cluster_id: clusterIds['Artificial Intelligence'],
            repository_url: 'https://github.com/ai-club/study-assistant',
            demo_url: 'https://study-ai.demo.com',
            tags: ['Python', 'TensorFlow', 'NLP', 'FastAPI', 'React'],
            members: [
                { user_id: userData['student300@swebuk.com'], role: 'maintainer' },
                { user_id: userData['student400_2@swebuk.com'], role: 'maintainer' },
                { user_id: userData['student200_2@swebuk.com'], role: 'member' }
            ]
        },
        {
            name: 'Image Classification API',
            description: 'RESTful API for image classification using pre-trained deep learning models.',
            type: 'cluster',
            visibility: 'public',
            status: 'completed',
            owner_id: userData['student300@swebuk.com'],
            cluster_id: clusterIds['Artificial Intelligence'],
            repository_url: 'https://github.com/ai-club/image-classifier',
            tags: ['Python', 'PyTorch', 'Flask', 'Docker', 'CNN'],
            members: [
                { user_id: userData['deputy2@swebuk.com'], role: 'member' }
            ]
        },
        {
            name: 'Chatbot Framework',
            description: 'Customizable chatbot framework for building conversational AI agents.',
            type: 'cluster',
            visibility: 'public',
            status: 'active',
            owner_id: userData['student400_2@swebuk.com'],
            cluster_id: clusterIds['Artificial Intelligence'],
            tags: ['Python', 'Transformers', 'Hugging Face', 'LangChain'],
            members: []
        },

        // Mobile Development Cluster Projects
        {
            name: 'Campus Navigator',
            description: 'Mobile app for navigating university campus with AR features and real-time building information.',
            type: 'cluster',
            visibility: 'public',
            status: 'active',
            owner_id: userData['student300_2@swebuk.com'],
            cluster_id: clusterIds['Mobile Development'],
            repository_url: 'https://github.com/mobile-dev/campus-nav',
            tags: ['React Native', 'ARKit', 'Google Maps API', 'Firebase'],
            members: [
                { user_id: userData['student100_2@swebuk.com'], role: 'member' },
                { user_id: userData['student400@swebuk.com'], role: 'member' }
            ]
        },
        {
            name: 'Fitness Tracker Pro',
            description: 'Cross-platform fitness tracking app with workout plans and nutrition tracking.',
            type: 'cluster',
            visibility: 'public',
            status: 'active',
            owner_id: userData['student400@swebuk.com'],
            cluster_id: clusterIds['Mobile Development'],
            demo_url: 'https://fitness-pro.app',
            tags: ['Flutter', 'Dart', 'SQLite', 'Health Kit'],
            members: []
        },

        // Cybersecurity Cluster Projects
        {
            name: 'Password Manager',
            description: 'Secure password manager with end-to-end encryption and biometric authentication.',
            type: 'cluster',
            visibility: 'public',
            status: 'active',
            owner_id: userData['student300@swebuk.com'],
            cluster_id: clusterIds['Cybersecurity'],
            repository_url: 'https://github.com/security/password-manager',
            tags: ['Go', 'AES-256', 'WebAuthn', 'SQLCipher'],
            members: [
                { user_id: userData['student200@swebuk.com'], role: 'member' }
            ]
        },
        {
            name: 'Network Security Scanner',
            description: 'Automated network vulnerability scanner and reporting tool.',
            type: 'cluster',
            visibility: 'private',
            status: 'active',
            owner_id: userData['student200@swebuk.com'],
            cluster_id: clusterIds['Cybersecurity'],
            tags: ['Python', 'Nmap', 'Scapy', 'Network Security'],
            members: []
        },

        // Personal Projects
        {
            name: 'Personal Portfolio Website',
            description: 'Modern portfolio website showcasing my projects, skills, and blog posts.',
            type: 'personal',
            visibility: 'public',
            status: 'active',
            owner_id: userData['student200@swebuk.com'],
            demo_url: 'https://mayapatel.dev',
            tags: ['Next.js', 'MDX', 'Framer Motion', 'Vercel'],
            members: []
        },
        {
            name: 'Budget Tracker',
            description: 'Personal finance management app to track expenses and set savings goals.',
            type: 'personal',
            visibility: 'public',
            status: 'active',
            owner_id: userData['student100_2@swebuk.com'],
            repository_url: 'https://github.com/liambrown/budget-tracker',
            tags: ['React', 'Redux', 'Chart.js', 'LocalStorage'],
            members: []
        },
        {
            name: 'Todo List CLI',
            description: 'Command-line todo list manager with tags, priorities, and due dates.',
            type: 'personal',
            visibility: 'public',
            status: 'completed',
            owner_id: userData['student100@swebuk.com'],
            repository_url: 'https://github.com/alexthompson/todo-cli',
            tags: ['Python', 'Click', 'SQLite', 'CLI'],
            members: []
        },
        {
            name: 'Weather Dashboard',
            description: 'Real-time weather dashboard with 7-day forecast and weather alerts.',
            type: 'personal',
            visibility: 'public',
            status: 'active',
            owner_id: userData['student200_2@swebuk.com'],
            demo_url: 'https://weather.oliviadavis.com',
            tags: ['JavaScript', 'OpenWeather API', 'HTML', 'CSS'],
            members: []
        },
        {
            name: 'Markdown Note App',
            description: 'Simple and elegant markdown note-taking application with syntax highlighting.',
            type: 'personal',
            visibility: 'private',
            status: 'active',
            owner_id: userData['student300_2@swebuk.com'],
            tags: ['Electron', 'React', 'CodeMirror', 'Markdown'],
            members: []
        },
        {
            name: 'Game of Life Simulator',
            description: 'Interactive Conway\'s Game of Life simulator with custom patterns and speed controls.',
            type: 'personal',
            visibility: 'public',
            status: 'completed',
            owner_id: userData['deputy2@swebuk.com'],
            repository_url: 'https://github.com/jessicawhite/game-of-life',
            demo_url: 'https://gameoflife.jessicawhite.dev',
            tags: ['JavaScript', 'Canvas API', 'Algorithms'],
            members: []
        }
    ];

    const projectIds: any = {};

    for (const proj of projectsToCreate) {
        const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .insert({
                name: proj.name,
                description: proj.description,
                type: proj.type,
                visibility: proj.visibility,
                status: proj.status,
                owner_id: proj.owner_id,
                cluster_id: proj.cluster_id || null,
                repository_url: proj.repository_url || null,
                demo_url: proj.demo_url || null
            })
            .select()
            .single();

        if (projectError) {
            console.error(`Error creating project ${proj.name}:`, projectError);
            continue;
        }

        projectIds[proj.name] = projectData.id;

        // Add owner as member
        await supabase.from('project_members').insert({
            project_id: projectData.id,
            user_id: proj.owner_id,
            role: 'owner',
            status: 'approved'
        });

        // Add tags
        if (proj.tags && proj.tags.length > 0) {
            for (const tag of proj.tags) {
                await supabase.from('project_tags').insert({
                    project_id: projectData.id,
                    tag: tag
                });
            }
        }

        // Add members
        if (proj.members && proj.members.length > 0) {
            for (const member of proj.members) {
                await supabase.from('project_members').insert({
                    project_id: projectData.id,
                    user_id: member.user_id,
                    role: member.role || 'member',
                    status: 'approved'
                });
            }
        }
    }

    // 4. Create FYP
    const fypData = {
        student_id: userData['student400@swebuk.com'],
        title: 'Automated Grading System for Programming Assignments',
        description: 'A system to automatically grade and provide feedback on code submissions.',
        status: 'in_progress',
        supervisor_id: userData['staff1@swebuk.com']
    };

    const { error: fypError } = await supabase.from('final_year_projects').insert(fypData);
    if(fypError) console.error("Error creating FYP:", fypError);


    return NextResponse.json({ message: 'Seeding completed successfully' });
  } catch (error: any) {
    console.error('Seeding failed:', error);
    return NextResponse.json({ error: 'Seeding failed', details: error.message }, { status: 500 });
  }
}
