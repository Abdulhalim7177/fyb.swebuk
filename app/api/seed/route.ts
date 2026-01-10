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
    // Events
    await supabase.from('event_feedback').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('event_certificates').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('event_attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('event_registrations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('event_tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // Blogs
    await supabase.from('blog_likes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('blog_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('blog_tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('blogs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
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
    const { data: users, error: listError } = await (supabase.auth as any).admin.listUsers({ perPage: 1000 });
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
            await (supabase.auth as any).admin.deleteUser(user.id);
        }
    }
    console.log("Cleanup complete.");


    // --- SEEDING ---
    console.log("Starting seeding...");

    const userData: any = {}; // Store created user IDs

    // 1. Create Users
    const usersToCreate = [
      { email: 'admin@swebuk.com', password: 'password', role: 'admin', name: 'System Admin', staff_number: 'ADM-001' },
      { email: 'staff1@swebuk.com', password: 'password', role: 'staff', name: 'Dr. Sarah Johnson', staff_number: 'STF-001' },
      { email: 'staff2@swebuk.com', password: 'password', role: 'staff', name: 'Prof. Michael Chen', staff_number: 'STF-002' },
      { email: 'staff3@swebuk.com', password: 'password', role: 'staff', name: 'Dr. Emily Rodriguez', staff_number: 'STF-003' },
      { email: 'student100@swebuk.com', password: 'password', role: 'student', academic_level: 'level_100', name: 'Alex Thompson', registration_number: '24/12345' },
      { email: 'student200@swebuk.com', password: 'password', role: 'student', academic_level: 'level_200', name: 'Maya Patel', registration_number: '23/23456' },
      { email: 'student300@swebuk.com', password: 'password', role: 'student', academic_level: 'level_300', name: 'James Wilson', registration_number: '22/34567' },
      { email: 'student400@swebuk.com', password: 'password', role: 'student', academic_level: 'level_400', name: 'Sophia Martinez', registration_number: '21/45678' },
      { email: 'student100_2@swebuk.com', password: 'password', role: 'student', academic_level: 'level_100', name: 'Liam Brown', registration_number: '24/12346' },
      { email: 'student200_2@swebuk.com', password: 'password', role: 'student', academic_level: 'level_200', name: 'Olivia Davis', registration_number: '23/23457' },
      { email: 'student300_2@swebuk.com', password: 'password', role: 'student', academic_level: 'level_300', name: 'Noah Anderson', registration_number: '22/34568' },
      { email: 'student400_2@swebuk.com', password: 'password', role: 'student', academic_level: 'level_400', name: 'Emma Taylor', registration_number: '21/45679' },
      { email: 'lead1@swebuk.com', password: 'password', role: 'student', academic_level: 'level_300', name: 'David Kim', registration_number: '22/34569' }, // Will be lead
      { email: 'lead2@swebuk.com', password: 'password', role: 'student', academic_level: 'level_300', name: 'Sarah Lee', registration_number: '22/34570' }, // Will be lead
      { email: 'deputy1@swebuk.com', password: 'password', role: 'student', academic_level: 'level_200', name: 'Ryan Murphy', registration_number: '23/23458' }, // Will be deputy
      { email: 'deputy2@swebuk.com', password: 'password', role: 'student', academic_level: 'level_200', name: 'Jessica White', registration_number: '23/23459' }, // Will be deputy
    ];

    for (const u of usersToCreate) {
      const { data, error } = await (supabase.auth as any).admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { 
          full_name: u.name,
          avatar_url: `https://i.pravatar.cc/150?u=${u.email}` 
        }
      });

      if (error) {
        console.error(`Error creating user ${u.email}:`, error);
        continue;
      }

      userData[u.email] = data.user.id;

      // Update Profile with role and additional fields
      // Note: Trigger creates profile, we update it.
      const updateData: any = {
        role: u.role,
        full_name: u.name,
        avatar_url: `https://i.pravatar.cc/150?u=${u.email}`,
        department: 'Software Engineering',
        faculty: 'Faculty of Computing',
        institution: 'Bayero University',
        skills: ['React', 'TypeScript', 'JavaScript', 'Python'],
        bio: `${u.name} is a ${u.role === 'student' ? 'passionate student' : 'dedicated staff member'} in the Software Engineering department.`,
        linkedin_url: `https://linkedin.com/in/${u.name.toLowerCase().replace(/\s+/g, '')}`,
        github_url: `https://github.com/${u.name.toLowerCase().replace(/\s+/g, '')}`
      };

      // Only set academic_level and registration_number for students
      if (u.academic_level) {
        updateData.academic_level = u.academic_level;
      }
      if (u.registration_number) {
        updateData.registration_number = u.registration_number;
      }
      if (u.staff_number) {
        updateData.staff_number = u.staff_number;
      }

      // Add role-specific fields
      try {
        if (u.role === 'student') {
          updateData.specialization = u.academic_level === 'level_400' ? 'Software Engineering' :
                                    u.academic_level === 'level_300' ? 'Web Development' :
                                    u.academic_level === 'level_200' ? 'Programming Fundamentals' :
                                    'Introduction to CS';
          updateData.gpa = u.academic_level === 'level_400' ? 4.75 :
                          u.academic_level === 'level_300' ? 4.50 :
                          u.academic_level === 'level_200' ? 4.25 :
                          4.00;
          updateData.academic_standing = 'Good';
          updateData.current_courses = u.academic_level === 'level_400' ? ['FYP', 'Advanced Software Engineering', 'Cloud Computing'] :
                                      u.academic_level === 'level_300' ? ['Software Engineering', 'Database Systems', 'Web Development'] :
                                      u.academic_level === 'level_200' ? ['Data Structures', 'Algorithms', 'OOP'] :
                                      ['Programming Logic', 'Intro to CS', 'Mathematics'];
          updateData.achievements = u.academic_level === 'level_400' ? ['Dean\'s List', 'Hackathon Winner'] :
                                   u.academic_level === 'level_300' ? ['Dean\'s List'] :
                                   u.academic_level === 'level_200' ? ['Programming Contest Winner'] :
                                   ['Outstanding Freshman'];
          updateData.interests = u.academic_level === 'level_400' ? 'Full-stack development, Cloud Architecture, DevOps' :
                               u.academic_level === 'level_300' ? 'Web Development, UI/UX Design, APIs' :
                               u.academic_level === 'level_200' ? 'Programming, Algorithms, Problem Solving' :
                               'Learning to code, Software Development';
          updateData.website_url = `https://${u.name.toLowerCase().replace(/\s+/g, '')}.com`;
          updateData.portfolio_items = [
            {
              id: '1',
              title: u.academic_level === 'level_400' ? 'Final Year Project' :
                    u.academic_level === 'level_300' ? 'Software Engineering Project' :
                    u.academic_level === 'level_200' ? 'Data Structures Project' :
                    'Intro to Programming Project',
              description: 'Major project showcasing skills in the field',
              url: `https://github.com/${u.name.toLowerCase().replace(/\s+/g, '')}/project`,
              type: 'project',
              date: new Date().toISOString().split('T')[0]
            },
            {
              id: '2',
              title: 'Personal Portfolio Website',
              description: 'Showcasing projects and skills',
              url: `https://${u.name.toLowerCase().replace(/\s+/g, '')}.com`,
              type: 'project',
              date: new Date().toISOString().split('T')[0]
            }
          ];
        } else if (u.role === 'staff' || u.role === 'admin') {
          // For staff and admin roles
          updateData.position = u.role === 'admin' ? 'System Administrator' :
                               u.name.includes('Prof.') ? 'Professor' :
                               u.name.includes('Dr.') ? 'Senior Lecturer' :
                               'Lecturer';
          updateData.office_location = u.role === 'admin' ? 'Admin Office, Main Building' :
                                     u.name.includes('Johnson') ? 'Room 205, CS Building' :
                                     u.name.includes('Chen') ? 'Room 301, Engineering Building' :
                                   'Room 102, CS Building';
          updateData.office_hours = u.role === 'admin' ? 'Mon-Fri 8am-4pm' :
                                u.name.includes('Johnson') ? 'Mon-Wed 10am-12pm' :
                                u.name.includes('Chen') ? 'Tue-Thu 2pm-4pm' :
                              'Mon-Fri 9am-11am';
          updateData.research_interests = u.role === 'admin' ? ['System Administration', 'Security', 'DevOps'] :
                                        u.name.includes('Johnson') ? ['Web Technologies', 'UI/UX', 'Human-Computer Interaction'] :
                                        u.name.includes('Chen') ? ['Machine Learning', 'AI', 'Data Science'] :
                                      ['Mobile Development', 'Security', 'Software Engineering'];
          updateData.department_role = u.role === 'admin' ? 'System Admin' : 'FYP Supervisor';
          updateData.qualifications = u.role === 'admin' ? 'MSc Information Technology' :
                                    u.name.includes('Prof.') ? 'PhD Computer Science' :
                                    u.name.includes('Dr.') ? 'PhD Software Engineering' :
                                  'MSc Computer Science';
          updateData.website_url = `https://${u.name.toLowerCase().replace(/\s+/g, '')}.com`;
        }

        await supabase.from('profiles').update(updateData).eq('id', data.user.id);
      } catch (error) {
        console.warn(`Warning: Could not update all profile fields for user ${u.email}. This may be due to schema not being updated yet. Error:`, error);

        // Try updating only the basic fields that are definitely in the schema
        const basicUpdateData: Record<string, any> = {
          role: updateData.role,
          full_name: updateData.full_name,
          avatar_url: updateData.avatar_url,
          department: updateData.department,
          faculty: updateData.faculty,
          institution: updateData.institution,
          skills: updateData.skills,
          bio: updateData.bio,
          linkedin_url: updateData.linkedin_url,
          github_url: updateData.github_url,
        };

        if (u.academic_level) basicUpdateData.academic_level = u.academic_level;
        if (u.registration_number) basicUpdateData.registration_number = u.registration_number;
        if (u.staff_number) basicUpdateData.staff_number = u.staff_number;

        await supabase.from('profiles').update(basicUpdateData).eq('id', data.user.id);
      }
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
            status: 'active',
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

    // 5. Create Blog Posts
    console.log("Creating blog posts...");

    const blogsToCreate = [
        // Published blogs by staff (auto-published)
        {
            author_id: userData['staff1@swebuk.com'],
            title: 'Getting Started with Next.js 14: A Comprehensive Guide',
            slug: 'getting-started-nextjs-14',
            excerpt: 'Learn the fundamentals of Next.js 14, including the App Router, Server Components, and best practices for building modern web applications.',
            content: `<h2>Introduction to Next.js 14</h2>
<p>Next.js 14 introduces significant improvements to the framework, making it easier than ever to build fast, scalable web applications. In this guide, we'll explore the key features and get you started with your first Next.js 14 project.</p>

<h3>What's New in Next.js 14</h3>
<ul>
<li><strong>Turbopack:</strong> The new Rust-based bundler for faster development builds</li>
<li><strong>Server Actions:</strong> Simplified form handling and data mutations</li>
<li><strong>Partial Prerendering:</strong> Combine static and dynamic content seamlessly</li>
</ul>

<h3>Setting Up Your First Project</h3>
<p>To create a new Next.js 14 project, run the following command:</p>
<pre><code>npx create-next-app@latest my-app</code></pre>

<h3>Understanding the App Router</h3>
<p>The App Router is the new paradigm for building Next.js applications. It uses file-system based routing with support for layouts, loading states, and error boundaries.</p>

<blockquote>
<p>"Next.js 14 represents a major step forward in web development, combining the best of server and client rendering." - Vercel Team</p>
</blockquote>

<h3>Conclusion</h3>
<p>Next.js 14 is a powerful framework that simplifies web development while providing excellent performance out of the box. Start building today!</p>`,
            category: 'frontend',
            status: 'published',
            is_featured: true,
            cluster_id: clusterIds['Web Development'],
            view_count: 245,
            read_time_minutes: 8,
            published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            tags: ['Next.js', 'React', 'Web Development', 'Tutorial']
        },
        {
            author_id: userData['staff2@swebuk.com'],
            title: 'Introduction to Machine Learning with Python',
            slug: 'intro-machine-learning-python',
            excerpt: 'A beginner-friendly introduction to machine learning concepts and implementation using Python and popular libraries like scikit-learn.',
            content: `<h2>What is Machine Learning?</h2>
<p>Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. In this article, we'll explore the fundamentals of ML and build our first model.</p>

<h3>Types of Machine Learning</h3>
<ol>
<li><strong>Supervised Learning:</strong> Learning from labeled data</li>
<li><strong>Unsupervised Learning:</strong> Finding patterns in unlabeled data</li>
<li><strong>Reinforcement Learning:</strong> Learning through trial and error</li>
</ol>

<h3>Getting Started with scikit-learn</h3>
<p>scikit-learn is one of the most popular ML libraries in Python. Let's build a simple classifier:</p>
<pre><code>from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Train the model
model = RandomForestClassifier()
model.fit(X_train, y_train)

# Make predictions
predictions = model.predict(X_test)</code></pre>

<h3>Best Practices</h3>
<ul>
<li>Always split your data into training and test sets</li>
<li>Normalize your features for better performance</li>
<li>Use cross-validation to avoid overfitting</li>
</ul>

<p>Machine learning is a vast field with endless possibilities. Keep learning and experimenting!</p>`,
            category: 'ai_ml',
            status: 'published',
            is_featured: true,
            cluster_id: clusterIds['Artificial Intelligence'],
            view_count: 312,
            read_time_minutes: 10,
            published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            tags: ['Python', 'Machine Learning', 'AI', 'scikit-learn', 'Data Science']
        },
        {
            author_id: userData['staff3@swebuk.com'],
            title: 'Building Cross-Platform Apps with Flutter',
            slug: 'building-cross-platform-flutter',
            excerpt: 'Discover how Flutter enables you to build beautiful, natively compiled applications for mobile, web, and desktop from a single codebase.',
            content: `<h2>Why Flutter?</h2>
<p>Flutter is Google's UI toolkit for building beautiful, natively compiled applications across mobile, web, and desktop from a single codebase. Here's why it's gaining popularity:</p>

<h3>Key Features</h3>
<ul>
<li><strong>Hot Reload:</strong> See changes instantly without losing state</li>
<li><strong>Widget-based:</strong> Everything is a widget in Flutter</li>
<li><strong>Native Performance:</strong> Compiles to native ARM code</li>
<li><strong>Rich ecosystem:</strong> Thousands of packages available</li>
</ul>

<h3>Your First Flutter App</h3>
<pre><code>import 'package:flutter/material.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: Text('Hello Flutter')),
        body: Center(child: Text('Welcome to Flutter!')),
      ),
    );
  }
}</code></pre>

<h3>State Management</h3>
<p>Flutter offers several state management solutions including Provider, Riverpod, and BLoC. Choose based on your app's complexity.</p>

<p>Start building with Flutter today and reach users on every platform!</p>`,
            category: 'mobile',
            status: 'published',
            is_featured: true,
            cluster_id: clusterIds['Mobile Development'],
            view_count: 189,
            read_time_minutes: 7,
            published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            tags: ['Flutter', 'Dart', 'Mobile Development', 'Cross-Platform']
        },

        // Published blogs by students (approved)
        {
            author_id: userData['student300@swebuk.com'],
            title: 'My Journey Learning React: Tips for Beginners',
            slug: 'learning-react-tips-beginners',
            excerpt: 'Personal insights and practical tips from my experience learning React as a Computer Science student.',
            content: `<h2>My React Learning Journey</h2>
<p>When I first started learning React six months ago, I was overwhelmed by the ecosystem. Here are the lessons I learned that I wish someone had told me from the start.</p>

<h3>Start with the Basics</h3>
<p>Don't jump into Redux or complex state management right away. Focus on:</p>
<ul>
<li>Understanding components and props</li>
<li>useState and useEffect hooks</li>
<li>Event handling and forms</li>
</ul>

<h3>Build Projects, Not Tutorials</h3>
<p>The best way to learn is by building. Start with small projects:</p>
<ol>
<li>A todo list app</li>
<li>A weather dashboard</li>
<li>A simple blog</li>
</ol>

<h3>Resources That Helped Me</h3>
<ul>
<li>Official React documentation (it's excellent!)</li>
<li>Building projects from scratch</li>
<li>Reading other people's code on GitHub</li>
</ul>

<blockquote>
<p>"The only way to learn programming is by programming." - A wise developer</p>
</blockquote>

<p>Keep coding and don't give up. The React ecosystem will start making sense with practice!</p>`,
            category: 'tutorials',
            status: 'published',
            cluster_id: clusterIds['Web Development'],
            view_count: 156,
            read_time_minutes: 5,
            approved_by: userData['staff1@swebuk.com'],
            approved_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            published_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            tags: ['React', 'JavaScript', 'Learning', 'Beginner']
        },
        {
            author_id: userData['student400@swebuk.com'],
            title: 'Preparing for Your Final Year Project: A Student Guide',
            slug: 'fyp-preparation-guide',
            excerpt: 'Essential tips for planning and executing a successful final year project in software engineering.',
            content: `<h2>Getting Ready for Your FYP</h2>
<p>Your Final Year Project is one of the most important milestones in your academic journey. Here's how to prepare for success.</p>

<h3>Choosing Your Topic</h3>
<p>Pick something you're passionate about, but also consider:</p>
<ul>
<li>Feasibility within the timeline</li>
<li>Availability of supervisor expertise</li>
<li>Resources and technologies required</li>
<li>Potential for innovation or real-world impact</li>
</ul>

<h3>Planning Your Timeline</h3>
<ol>
<li><strong>Month 1-2:</strong> Research and proposal</li>
<li><strong>Month 3-4:</strong> Design and architecture</li>
<li><strong>Month 5-6:</strong> Core development</li>
<li><strong>Month 7-8:</strong> Testing and refinement</li>
<li><strong>Month 9:</strong> Documentation and presentation</li>
</ol>

<h3>Working with Your Supervisor</h3>
<p>Regular communication is key. Schedule weekly or bi-weekly meetings and come prepared with:</p>
<ul>
<li>Progress updates</li>
<li>Specific questions or blockers</li>
<li>Next steps and goals</li>
</ul>

<h3>Tools I Recommend</h3>
<ul>
<li>GitHub for version control</li>
<li>Notion for documentation</li>
<li>Figma for designs</li>
<li>Trello or Jira for task management</li>
</ul>

<p>Good luck with your FYP! It's challenging but incredibly rewarding.</p>`,
            category: 'tips',
            status: 'published',
            view_count: 423,
            read_time_minutes: 6,
            approved_by: userData['staff1@swebuk.com'],
            approved_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            published_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            tags: ['FYP', 'Career', 'Tips', 'Project Management']
        },
        {
            author_id: userData['lead2@swebuk.com'],
            title: 'Understanding Neural Networks: A Visual Guide',
            slug: 'understanding-neural-networks-visual',
            excerpt: 'A simplified explanation of how neural networks work with visual examples and analogies.',
            content: `<h2>Neural Networks Demystified</h2>
<p>Neural networks might seem like magic, but they're based on simple mathematical principles. Let's break them down.</p>

<h3>The Building Block: Neurons</h3>
<p>A neuron takes inputs, applies weights, adds them up, and passes the result through an activation function. Think of it like a decision-maker.</p>

<h3>Layers of Understanding</h3>
<ul>
<li><strong>Input Layer:</strong> Receives the raw data</li>
<li><strong>Hidden Layers:</strong> Process and transform the data</li>
<li><strong>Output Layer:</strong> Produces the final result</li>
</ul>

<h3>The Learning Process</h3>
<ol>
<li>Forward pass: Data flows through the network</li>
<li>Calculate error: Compare output to expected result</li>
<li>Backpropagation: Adjust weights to reduce error</li>
<li>Repeat until the network learns</li>
</ol>

<h3>Common Types</h3>
<ul>
<li><strong>CNNs:</strong> Great for images</li>
<li><strong>RNNs:</strong> Perfect for sequences</li>
<li><strong>Transformers:</strong> State-of-the-art for NLP</li>
</ul>

<p>Neural networks are the foundation of modern AI. Understanding them opens doors to amazing possibilities!</p>`,
            category: 'ai_ml',
            status: 'published',
            cluster_id: clusterIds['Artificial Intelligence'],
            view_count: 278,
            read_time_minutes: 8,
            approved_by: userData['staff2@swebuk.com'],
            approved_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            published_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            tags: ['Neural Networks', 'Deep Learning', 'AI', 'Machine Learning']
        },
        {
            author_id: userData['student200@swebuk.com'],
            title: 'CSS Grid vs Flexbox: When to Use Which',
            slug: 'css-grid-vs-flexbox',
            excerpt: 'A practical comparison of CSS Grid and Flexbox with examples of when to use each layout method.',
            content: `<h2>The Layout Dilemma</h2>
<p>Both CSS Grid and Flexbox are powerful layout tools, but they shine in different situations. Let's explore when to use each.</p>

<h3>Flexbox: One-Dimensional Layouts</h3>
<p>Use Flexbox when you need to arrange items in a single row or column:</p>
<pre><code>.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}</code></pre>

<p>Perfect for:</p>
<ul>
<li>Navigation bars</li>
<li>Card layouts in a row</li>
<li>Centering content</li>
<li>Equal-height columns</li>
</ul>

<h3>CSS Grid: Two-Dimensional Layouts</h3>
<p>Use Grid when you need control over rows AND columns:</p>
<pre><code>.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}</code></pre>

<p>Perfect for:</p>
<ul>
<li>Page layouts</li>
<li>Image galleries</li>
<li>Complex dashboards</li>
<li>Magazine-style layouts</li>
</ul>

<h3>Use Both Together!</h3>
<p>The best approach often combines both. Use Grid for the overall page structure and Flexbox for components within grid items.</p>

<p>Master both tools and you'll be able to create any layout you can imagine!</p>`,
            category: 'frontend',
            status: 'published',
            cluster_id: clusterIds['Web Development'],
            view_count: 134,
            read_time_minutes: 5,
            approved_by: userData['lead1@swebuk.com'],
            approved_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            published_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            tags: ['CSS', 'Frontend', 'Web Design', 'Layout']
        },

        // Pending approval blogs
        {
            author_id: userData['student100@swebuk.com'],
            title: 'My First Month as a CS Student: Lessons Learned',
            slug: 'first-month-cs-student-lessons',
            excerpt: 'Reflections on my first month studying Computer Science and tips for incoming freshmen.',
            content: `<h2>Starting My CS Journey</h2>
<p>One month into my Computer Science degree, and I've already learned so much - not just about coding, but about how to succeed as a student.</p>

<h3>What Surprised Me</h3>
<ul>
<li>The pace is fast - stay on top of assignments</li>
<li>Group projects start early</li>
<li>Office hours are incredibly valuable</li>
<li>The community is welcoming</li>
</ul>

<h3>Tips for Newcomers</h3>
<ol>
<li>Start assignments early</li>
<li>Form study groups</li>
<li>Don't be afraid to ask questions</li>
<li>Practice coding daily, even if just for 30 minutes</li>
</ol>

<p>I'm excited for what's ahead!</p>`,
            category: 'career',
            status: 'pending_approval',
            view_count: 0,
            read_time_minutes: 4,
            tags: ['Student Life', 'Career', 'Advice', 'Freshman']
        },
        {
            author_id: userData['student200_2@swebuk.com'],
            title: 'Building a REST API with Node.js and Express',
            slug: 'building-rest-api-nodejs-express',
            excerpt: 'Step-by-step guide to creating a RESTful API using Node.js and Express framework.',
            content: `<h2>Creating Your First REST API</h2>
<p>REST APIs are the backbone of modern web applications. Let's build one from scratch using Node.js and Express.</p>

<h3>Project Setup</h3>
<pre><code>npm init -y
npm install express</code></pre>

<h3>Basic Server</h3>
<pre><code>const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});</code></pre>

<h3>CRUD Operations</h3>
<ul>
<li>GET: Retrieve data</li>
<li>POST: Create new data</li>
<li>PUT: Update existing data</li>
<li>DELETE: Remove data</li>
</ul>

<p>With these basics, you can build powerful APIs!</p>`,
            category: 'backend',
            status: 'pending_approval',
            cluster_id: clusterIds['Web Development'],
            view_count: 0,
            read_time_minutes: 7,
            tags: ['Node.js', 'Express', 'API', 'Backend']
        },

        // Draft blogs
        {
            author_id: userData['student300_2@swebuk.com'],
            title: 'Introduction to Docker for Developers',
            slug: 'intro-docker-developers',
            excerpt: 'Learn the basics of Docker and how containerization can improve your development workflow.',
            content: `<h2>Why Docker?</h2>
<p>Docker simplifies development by ensuring your app runs the same everywhere. No more "it works on my machine" problems!</p>

<h3>Key Concepts</h3>
<ul>
<li>Images: Blueprints for containers</li>
<li>Containers: Running instances of images</li>
<li>Dockerfile: Instructions to build an image</li>
</ul>

<p>More content coming soon...</p>`,
            category: 'devops',
            status: 'draft',
            view_count: 0,
            read_time_minutes: 5,
            tags: ['Docker', 'DevOps', 'Containers']
        },

        // Rejected blog
        {
            author_id: userData['student100_2@swebuk.com'],
            title: 'Quick Code Snippets Collection',
            slug: 'quick-code-snippets',
            excerpt: 'A collection of useful code snippets.',
            content: `<p>Just some random code I found useful.</p>`,
            category: 'tips',
            status: 'rejected',
            rejected_reason: 'The content is too brief and lacks original insights. Please expand with explanations and context for each snippet.',
            view_count: 0,
            read_time_minutes: 1,
            tags: ['Code', 'Snippets']
        },

        // More published blogs for variety
        {
            author_id: userData['admin@swebuk.com'],
            title: 'Welcome to Swebuk Community Blog',
            slug: 'welcome-swebuk-community',
            excerpt: 'An introduction to our community blog platform and how you can contribute.',
            content: `<h2>Welcome to Our Community!</h2>
<p>We're excited to launch the Swebuk Community Blog - a platform where students and staff can share knowledge, experiences, and insights about software engineering.</p>

<h3>What You Can Share</h3>
<ul>
<li>Technical tutorials and guides</li>
<li>Project showcases</li>
<li>Learning experiences</li>
<li>Career advice</li>
<li>Event announcements</li>
</ul>

<h3>How to Contribute</h3>
<p>Simply navigate to your dashboard and click "New Post". Students' posts go through a quick approval process, while staff posts are published immediately.</p>

<h3>Community Guidelines</h3>
<ol>
<li>Be respectful and constructive</li>
<li>Cite your sources</li>
<li>Share original content</li>
<li>Help others learn</li>
</ol>

<p>We can't wait to see what you'll share!</p>`,
            category: 'announcements',
            status: 'published',
            is_featured: false,
            view_count: 567,
            read_time_minutes: 3,
            published_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            tags: ['Announcement', 'Community', 'Welcome']
        },
        {
            author_id: userData['deputy1@swebuk.com'],
            title: 'Git Best Practices for Team Projects',
            slug: 'git-best-practices-teams',
            excerpt: 'Essential Git workflows and practices for successful team collaboration.',
            content: `<h2>Git for Teams</h2>
<p>Working with Git in a team requires discipline and good practices. Here's what I've learned leading projects.</p>

<h3>Branch Strategy</h3>
<ul>
<li><strong>main:</strong> Production-ready code</li>
<li><strong>develop:</strong> Integration branch</li>
<li><strong>feature/*:</strong> New features</li>
<li><strong>bugfix/*:</strong> Bug fixes</li>
</ul>

<h3>Commit Messages</h3>
<p>Good commit messages make history readable:</p>
<pre><code>feat: add user authentication
fix: resolve login redirect issue
docs: update API documentation
refactor: simplify validation logic</code></pre>

<h3>Pull Request Etiquette</h3>
<ol>
<li>Keep PRs small and focused</li>
<li>Write clear descriptions</li>
<li>Request reviews from relevant team members</li>
<li>Address feedback promptly</li>
</ol>

<p>Good Git practices lead to smoother collaboration!</p>`,
            category: 'devops',
            status: 'published',
            cluster_id: clusterIds['Web Development'],
            view_count: 198,
            read_time_minutes: 6,
            approved_by: userData['staff1@swebuk.com'],
            approved_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            published_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            tags: ['Git', 'Version Control', 'Teamwork', 'Best Practices']
        }
    ];

    const blogIds: any = {};

    for (const blog of blogsToCreate) {
        const { tags, ...blogData } = blog;

        const { data: createdBlog, error: blogError } = await supabase
            .from('blogs')
            .insert({
                ...blogData,
                created_at: blogData.published_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (blogError) {
            console.error(`Error creating blog "${blog.title}":`, blogError);
            continue;
        }

        blogIds[blog.slug] = createdBlog.id;

        // Add tags
        if (tags && tags.length > 0) {
            for (const tag of tags) {
                await supabase.from('blog_tags').insert({
                    blog_id: createdBlog.id,
                    tag: tag.toLowerCase()
                });
            }
        }
    }

    // 6. Create Blog Comments
    console.log("Creating blog comments...");

    const commentsToCreate = [
        {
            blog_slug: 'getting-started-nextjs-14',
            user_id: userData['student300@swebuk.com'],
            content: 'Great article! The section on Server Components was exactly what I needed. Thanks for the clear explanation!'
        },
        {
            blog_slug: 'getting-started-nextjs-14',
            user_id: userData['student200@swebuk.com'],
            content: 'I\'ve been struggling with the App Router, but this guide made it click. Would love to see a follow-up on advanced routing patterns!'
        },
        {
            blog_slug: 'intro-machine-learning-python',
            user_id: userData['student400_2@swebuk.com'],
            content: 'This is a fantastic introduction! I used this guide to build my first classifier for my AI course project.'
        },
        {
            blog_slug: 'intro-machine-learning-python',
            user_id: userData['lead2@swebuk.com'],
            content: 'Perfect for beginners. The code examples are clear and easy to follow. Highly recommend this to anyone starting with ML.'
        },
        {
            blog_slug: 'fyp-preparation-guide',
            user_id: userData['student400_2@swebuk.com'],
            content: 'As someone about to start my FYP, this is incredibly helpful. The timeline breakdown is realistic and practical.'
        },
        {
            blog_slug: 'fyp-preparation-guide',
            user_id: userData['student300@swebuk.com'],
            content: 'I wish I had this guide when I started planning my FYP. The supervisor communication tips are spot on!'
        },
        {
            blog_slug: 'understanding-neural-networks-visual',
            user_id: userData['student200_2@swebuk.com'],
            content: 'Finally, an explanation that makes sense! The analogy of neurons as decision-makers really helped me understand.'
        },
        {
            blog_slug: 'css-grid-vs-flexbox',
            user_id: userData['student100@swebuk.com'],
            content: 'I always got confused about which to use. This comparison cleared everything up. Bookmarking this!'
        }
    ];

    for (const comment of commentsToCreate) {
        if (blogIds[comment.blog_slug]) {
            await supabase.from('blog_comments').insert({
                blog_id: blogIds[comment.blog_slug],
                user_id: comment.user_id,
                content: comment.content
            });
        }
    }

    // 7. Create Blog Likes
    console.log("Creating blog likes...");

    const likesToCreate = [
        { blog_slug: 'getting-started-nextjs-14', user_ids: [userData['student100@swebuk.com'], userData['student200@swebuk.com'], userData['student300@swebuk.com'], userData['lead1@swebuk.com'], userData['deputy1@swebuk.com']] },
        { blog_slug: 'intro-machine-learning-python', user_ids: [userData['student400@swebuk.com'], userData['student400_2@swebuk.com'], userData['lead2@swebuk.com'], userData['deputy2@swebuk.com']] },
        { blog_slug: 'building-cross-platform-flutter', user_ids: [userData['student100_2@swebuk.com'], userData['student200@swebuk.com']] },
        { blog_slug: 'fyp-preparation-guide', user_ids: [userData['student300@swebuk.com'], userData['student400_2@swebuk.com'], userData['lead1@swebuk.com'], userData['lead2@swebuk.com'], userData['student200@swebuk.com'], userData['student100@swebuk.com']] },
        { blog_slug: 'understanding-neural-networks-visual', user_ids: [userData['student400@swebuk.com'], userData['student300@swebuk.com'], userData['student200_2@swebuk.com']] },
        { blog_slug: 'css-grid-vs-flexbox', user_ids: [userData['student100@swebuk.com'], userData['student100_2@swebuk.com'], userData['deputy1@swebuk.com']] },
        { blog_slug: 'git-best-practices-teams', user_ids: [userData['student200@swebuk.com'], userData['student300_2@swebuk.com'], userData['lead1@swebuk.com']] }
    ];

    for (const likeGroup of likesToCreate) {
        if (blogIds[likeGroup.blog_slug]) {
            for (const userId of likeGroup.user_ids) {
                await supabase.from('blog_likes').insert({
                    blog_id: blogIds[likeGroup.blog_slug],
                    user_id: userId
                });
            }
        }
    }

    console.log("Blog seeding complete!");

    // 8. Create Events
    console.log("Creating events...");

    const eventsToCreate = [
        {
            organizer_id: userData['staff1@swebuk.com'],
            title: 'Introduction to Web Development Workshop',
            slug: 'intro-web-dev-workshop',
            description: 'A comprehensive workshop covering HTML, CSS, and JavaScript fundamentals. Perfect for beginners looking to start their web development journey.',
            short_description: 'Learn the basics of web development in this hands-on workshop.',
            event_type: 'workshop',
            category: 'technical',
            start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // +4 hours
            registration_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            location_type: 'physical',
            venue_name: 'Main Auditorium',
            location: 'Computer Science Building, Room 101',
            max_capacity: 50,
            is_registration_required: true,
            is_public: true,
            status: 'published',
            certificate_enabled: true,
            published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            tags: ['Web Development', 'HTML', 'CSS', 'JavaScript', 'Beginners']
        },
        {
            organizer_id: userData['staff2@swebuk.com'],
            title: 'AI & Machine Learning Seminar',
            slug: 'ai-ml-seminar',
            description: 'Join us for an enlightening seminar on the latest trends in Artificial Intelligence and Machine Learning. Industry experts will share insights on neural networks, deep learning, and practical applications.',
            short_description: 'Explore the future of AI with industry experts.',
            event_type: 'seminar',
            category: 'technical',
            start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
            end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
            registration_deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
            location_type: 'hybrid',
            venue_name: 'Lecture Hall A',
            location: 'Engineering Building, Level 3',
            meeting_url: 'https://meet.google.com/abc-defg-hij',
            max_capacity: 100,
            is_registration_required: true,
            is_public: true,
            status: 'published',
            certificate_enabled: true,
            cluster_id: clusterIds['Artificial Intelligence'],
            published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            tags: ['AI', 'Machine Learning', 'Deep Learning', 'Neural Networks']
        },
        {
            organizer_id: userData['staff3@swebuk.com'],
            title: 'Spring 2024 Hackathon',
            slug: 'spring-2024-hackathon',
            description: '24-hour coding marathon! Build innovative solutions, collaborate with peers, and compete for amazing prizes. Categories include Web Apps, Mobile Apps, AI/ML, and Social Impact.',
            short_description: '24-hour hackathon with prizes and mentorship.',
            event_type: 'hackathon',
            category: 'technical',
            start_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days from now
            end_date: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(), // +24 hours
            registration_deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
            location_type: 'physical',
            venue_name: 'Innovation Lab',
            location: 'Technology Center, Ground Floor',
            max_capacity: 80,
            is_registration_required: true,
            is_public: true,
            status: 'published',
            certificate_enabled: true,
            published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            tags: ['Hackathon', 'Coding', 'Competition', 'Innovation']
        },
        {
            organizer_id: userData['staff1@swebuk.com'],
            title: 'Career Development: Tech Interviews',
            slug: 'career-tech-interviews',
            description: 'Master the art of technical interviews! Learn about common interview questions, coding challenges, system design, and behavioral questions. Includes mock interviews and feedback.',
            short_description: 'Ace your tech interviews with expert guidance.',
            event_type: 'training',
            category: 'career',
            start_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
            registration_deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
            location_type: 'online',
            meeting_url: 'https://zoom.us/j/123456789',
            is_registration_required: true,
            is_public: true,
            status: 'published',
            certificate_enabled: false,
            published_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            tags: ['Career', 'Interviews', 'Job Search', 'Technical Skills']
        },
        {
            organizer_id: userData['staff2@swebuk.com'],
            title: 'React.js Masterclass',
            slug: 'reactjs-masterclass',
            description: 'Deep dive into React.js! Learn advanced concepts including hooks, context API, performance optimization, and testing. Build a real-world application from scratch.',
            short_description: 'Advanced React.js training for experienced developers.',
            event_type: 'workshop',
            category: 'technical',
            start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
            registration_deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
            location_type: 'physical',
            venue_name: 'Computer Lab 2',
            location: 'CS Building, Room 205',
            max_capacity: 30,
            is_registration_required: true,
            is_public: true,
            status: 'published',
            certificate_enabled: true,
            cluster_id: clusterIds['Web Development'],
            published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            tags: ['React', 'JavaScript', 'Frontend', 'Web Development']
        },
        {
            organizer_id: userData['staff3@swebuk.com'],
            title: 'Networking Night: Meet Industry Professionals',
            slug: 'networking-night-industry',
            description: 'Connect with tech industry professionals, alumni, and potential employers. Great opportunity to learn about career paths, get advice, and make valuable connections.',
            short_description: 'Network with tech professionals and alumni.',
            event_type: 'meetup',
            category: 'networking',
            start_date: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString(),
            end_date: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
            location_type: 'physical',
            venue_name: 'Student Center Lounge',
            location: 'Student Center, 2nd Floor',
            max_capacity: 60,
            is_registration_required: true,
            is_public: true,
            status: 'published',
            certificate_enabled: false,
            published_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            tags: ['Networking', 'Career', 'Industry', 'Alumni']
        }
    ];

    const eventIds: any = {};

    for (const event of eventsToCreate) {
        // Extract tags from event object before insertion
        const { tags, ...eventWithoutTags } = event;

        const { data: eventData, error: eventError } = await supabase
            .from('events')
            .insert(eventWithoutTags)
            .select()
            .single();

        if (eventError) {
            console.error(`Error creating event "${event.title}":`, eventError);
            continue;
        }

        if (eventData) {
            eventIds[event.slug] = eventData.id;

            // Add tags if provided
            if (tags) {
                for (const tag of tags) {
                    await supabase.from('event_tags').insert({
                        event_id: eventData.id,
                        tag: tag.toLowerCase()
                    });
                }
            }
        }
    }

    // 9. Create Event Registrations
    console.log("Creating event registrations...");

    const registrationsToCreate = [
        { event_slug: 'intro-web-dev-workshop', user_emails: ['student100@swebuk.com', 'student100_2@swebuk.com', 'student200@swebuk.com', 'deputy1@swebuk.com'] },
        { event_slug: 'ai-ml-seminar', user_emails: ['student400@swebuk.com', 'student400_2@swebuk.com', 'lead2@swebuk.com', 'student300@swebuk.com'] },
        { event_slug: 'spring-2024-hackathon', user_emails: ['student200_2@swebuk.com', 'student300_2@swebuk.com', 'lead1@swebuk.com', 'deputy2@swebuk.com'] },
        { event_slug: 'career-tech-interviews', user_emails: ['student300@swebuk.com', 'student400@swebuk.com', 'student200@swebuk.com'] },
        { event_slug: 'reactjs-masterclass', user_emails: ['student200@swebuk.com', 'student200_2@swebuk.com', 'lead1@swebuk.com'] },
        { event_slug: 'networking-night-industry', user_emails: ['student400@swebuk.com', 'student400_2@swebuk.com', 'student300@swebuk.com', 'lead2@swebuk.com', 'deputy1@swebuk.com'] }
    ];

    for (const regGroup of registrationsToCreate) {
        if (eventIds[regGroup.event_slug]) {
            for (const userEmail of regGroup.user_emails) {
                const userId = userData[userEmail];
                if (userId) {
                    await supabase.from('event_registrations').insert({
                        event_id: eventIds[regGroup.event_slug],
                        user_id: userId,
                        status: 'registered'
                    });
                }
            }
        }
    }

    console.log("Event seeding complete!");

    return NextResponse.json({ message: 'Seeding completed successfully' });
  } catch (error: any) {
    console.error('Seeding failed:', error);
    return NextResponse.json({ error: 'Seeding failed', details: error.message }, { status: 500 });
  }
}
