import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_USERS = [
  { name: "Aarav Sharma", bio: "Full-stack developer passionate about scalable web apps.", college: "IIT Delhi", degree: "B.Tech Computer Science", year: "3rd Year", skills: ["React", "Node.js", "TypeScript"], paid: true, min: 500, max: 5000 },
  { name: "Priya Patel", bio: "UI/UX designer with a love for minimal interfaces.", college: "NIT Trichy", degree: "B.Des Communication Design", year: "4th Year", skills: ["Figma", "UI Design", "Prototyping"], paid: true, min: 1000, max: 8000 },
  { name: "Rohan Gupta", bio: "ML enthusiast exploring NLP and computer vision.", college: "BITS Pilani", degree: "M.Tech AI & ML", year: "2nd Year", skills: ["Python", "TensorFlow", "NLP"], paid: false, min: 500, max: 3000 },
  { name: "Sneha Reddy", bio: "Backend developer skilled in Node.js and Python.", college: "IIT Bombay", degree: "B.Tech IT", year: "3rd Year", skills: ["Node.js", "Python", "PostgreSQL"], paid: true, min: 2000, max: 10000 },
  { name: "Arjun Nair", bio: "Mobile app developer specializing in React Native.", college: "VIT Vellore", degree: "B.Tech CSE", year: "4th Year", skills: ["React Native", "Flutter", "Dart"], paid: true, min: 1500, max: 7000 },
  { name: "Kavya Iyer", bio: "Data scientist with expertise in statistical modeling.", college: "IISc Bangalore", degree: "M.Sc Data Science", year: "1st Year", skills: ["R", "Python", "Statistics"], paid: false, min: 500, max: 5000 },
  { name: "Vikram Singh", bio: "DevOps engineer focused on CI/CD and cloud infra.", college: "DTU Delhi", degree: "B.Tech CSE", year: "4th Year", skills: ["Docker", "Kubernetes", "AWS"], paid: true, min: 3000, max: 15000 },
  { name: "Ananya Joshi", bio: "Frontend developer who loves React and TypeScript.", college: "IIIT Hyderabad", degree: "B.Tech CSE", year: "3rd Year", skills: ["React", "TypeScript", "Tailwind"], paid: true, min: 1000, max: 6000 },
  { name: "Karthik Menon", bio: "Cybersecurity researcher interested in ethical hacking.", college: "NIT Surathkal", degree: "B.Tech IT", year: "4th Year", skills: ["Penetration Testing", "Linux", "Networking"], paid: false, min: 500, max: 4000 },
  { name: "Divya Krishnan", bio: "Game developer working with Unity and Unreal Engine.", college: "Manipal University", degree: "B.Tech CSE", year: "2nd Year", skills: ["Unity", "C#", "3D Modeling"], paid: true, min: 800, max: 5000 },
  { name: "Rahul Verma", bio: "Blockchain developer exploring DeFi and smart contracts.", college: "IIT Kanpur", degree: "B.Tech CSE", year: "3rd Year", skills: ["Solidity", "Ethereum", "Web3"], paid: true, min: 2000, max: 12000 },
  { name: "Meera Desai", bio: "Product designer creating user-centered experiences.", college: "NID Ahmedabad", degree: "M.Des Product Design", year: "2nd Year", skills: ["Product Design", "User Research", "Figma"], paid: true, min: 1500, max: 8000 },
  { name: "Siddharth Rao", bio: "Cloud architect with AWS and GCP certifications.", college: "BITS Goa", degree: "B.Tech CSE", year: "4th Year", skills: ["AWS", "GCP", "Terraform"], paid: true, min: 5000, max: 20000 },
  { name: "Nisha Agarwal", bio: "Content writer and SEO specialist for tech startups.", college: "Delhi University", degree: "BA English", year: "3rd Year", skills: ["Content Writing", "SEO", "Copywriting"], paid: true, min: 500, max: 3000 },
  { name: "Aditya Kumar", bio: "Embedded systems engineer working with IoT devices.", college: "IIT Madras", degree: "B.Tech ECE", year: "4th Year", skills: ["Arduino", "Raspberry Pi", "C++"], paid: false, min: 1000, max: 5000 },
  { name: "Pooja Bhatt", bio: "Graphic designer skilled in Figma and Illustrator.", college: "Srishti Institute", degree: "BDes Visual Communication", year: "3rd Year", skills: ["Illustrator", "Photoshop", "Branding"], paid: true, min: 800, max: 4000 },
  { name: "Manish Tiwari", bio: "Python developer automating workflows and building APIs.", college: "NSIT Delhi", degree: "B.Tech IT", year: "3rd Year", skills: ["Python", "FastAPI", "Automation"], paid: true, min: 1000, max: 6000 },
  { name: "Ritu Saxena", bio: "Technical writer for open source projects.", college: "IIT Roorkee", degree: "B.Tech CSE", year: "2nd Year", skills: ["Technical Writing", "Documentation", "Markdown"], paid: false, min: 500, max: 2000 },
  { name: "Deepak Choudhary", bio: "Android developer with 3 published apps.", college: "LNMIIT Jaipur", degree: "B.Tech CSE", year: "4th Year", skills: ["Android", "Kotlin", "Java"], paid: true, min: 1500, max: 7000 },
  { name: "Sana Sheikh", bio: "AR/VR developer creating immersive experiences.", college: "IIT Kharagpur", degree: "B.Tech CSE", year: "3rd Year", skills: ["ARKit", "Unity", "VR Development"], paid: true, min: 2000, max: 10000 },
  { name: "Harsh Pandey", bio: "Competitive programmer with 5-star Codeforces rating.", college: "IIT Guwahati", degree: "B.Tech CSE", year: "2nd Year", skills: ["C++", "Algorithms", "Data Structures"], paid: false, min: 500, max: 3000 },
  { name: "Ishita Malhotra", bio: "Digital marketer specializing in growth hacking.", college: "MICA Ahmedabad", degree: "MBA Marketing", year: "1st Year", skills: ["Digital Marketing", "Analytics", "Growth Hacking"], paid: true, min: 1000, max: 5000 },
  { name: "Nikhil Jain", bio: "Database admin experienced in PostgreSQL and MongoDB.", college: "NIT Warangal", degree: "B.Tech IT", year: "4th Year", skills: ["PostgreSQL", "MongoDB", "Redis"], paid: true, min: 2000, max: 8000 },
  { name: "Tanvi Mehta", bio: "Video editor and motion graphics artist.", college: "Whistling Woods", degree: "BA Film Making", year: "3rd Year", skills: ["After Effects", "Premiere Pro", "Motion Graphics"], paid: true, min: 1000, max: 6000 },
  { name: "Rajesh Pillai", bio: "Full-stack Java developer for enterprise apps.", college: "COEP Pune", degree: "B.Tech CSE", year: "4th Year", skills: ["Java", "Spring Boot", "Microservices"], paid: true, min: 3000, max: 12000 },
  { name: "Swati Mishra", bio: "NLP researcher working on Hindi language processing.", college: "IIIT Delhi", degree: "M.Tech CSE", year: "2nd Year", skills: ["NLP", "Python", "Deep Learning"], paid: false, min: 1000, max: 5000 },
  { name: "Amit Saxena", bio: "iOS developer with expertise in Swift and SwiftUI.", college: "IIT BHU", degree: "B.Tech CSE", year: "3rd Year", skills: ["Swift", "SwiftUI", "iOS"], paid: true, min: 2000, max: 9000 },
  { name: "Neha Kapoor", bio: "Business analyst bridging tech and business.", college: "XLRI Jamshedpur", degree: "MBA", year: "2nd Year", skills: ["Business Analysis", "SQL", "Tableau"], paid: true, min: 1500, max: 7000 },
  { name: "Gaurav Sharma", bio: "Robotics engineer building autonomous systems.", college: "IIT Ropar", degree: "B.Tech ME", year: "4th Year", skills: ["ROS", "Python", "Robotics"], paid: false, min: 2000, max: 8000 },
  { name: "Pallavi Sinha", bio: "QA engineer specializing in test automation.", college: "MNNIT Allahabad", degree: "B.Tech CSE", year: "3rd Year", skills: ["Selenium", "Jest", "Cypress"], paid: true, min: 1000, max: 5000 },
  { name: "Suresh Rajan", bio: "Rust and Go developer building high-perf systems.", college: "IIT Hyderabad", degree: "B.Tech CSE", year: "4th Year", skills: ["Rust", "Go", "Systems Programming"], paid: true, min: 3000, max: 15000 },
  { name: "Aditi Banerjee", bio: "Illustration artist creating digital art and NFTs.", college: "JJ School of Art", degree: "BFA", year: "3rd Year", skills: ["Digital Art", "Illustration", "Procreate"], paid: true, min: 500, max: 4000 },
  { name: "Varun Kapoor", bio: "System designer focused on distributed computing.", college: "DAIICT Gandhinagar", degree: "B.Tech ICT", year: "4th Year", skills: ["System Design", "Distributed Systems", "Java"], paid: true, min: 2000, max: 10000 },
  { name: "Simran Kaur", bio: "Social media manager and brand strategist.", college: "Symbiosis Pune", degree: "BBA", year: "3rd Year", skills: ["Social Media", "Brand Strategy", "Content Planning"], paid: true, min: 800, max: 4000 },
  { name: "Prakash Yadav", bio: "Data engineer building ETL pipelines.", college: "NIT Rourkela", degree: "B.Tech CSE", year: "4th Year", skills: ["Apache Spark", "Airflow", "SQL"], paid: true, min: 2000, max: 9000 },
  { name: "Shreya Das", bio: "Web3 developer creating decentralized applications.", college: "IIT Indore", degree: "B.Tech CSE", year: "3rd Year", skills: ["Solidity", "React", "DApps"], paid: true, min: 2500, max: 12000 },
  { name: "Manoj Kumar", bio: "PHP and Laravel developer with freelancing experience.", college: "Amity University", degree: "B.Tech CSE", year: "4th Year", skills: ["PHP", "Laravel", "MySQL"], paid: true, min: 1000, max: 5000 },
  { name: "Anjali Gupta", bio: "ML engineer focused on recommendation systems.", college: "IIT Patna", degree: "M.Tech CSE", year: "1st Year", skills: ["Machine Learning", "Python", "Scikit-learn"], paid: false, min: 1500, max: 7000 },
  { name: "Tushar Agrawal", bio: "React Native developer building cross-platform apps.", college: "IIIT Bangalore", degree: "B.Tech CSE", year: "3rd Year", skills: ["React Native", "JavaScript", "Firebase"], paid: true, min: 1500, max: 7000 },
  { name: "Lakshmi Nair", bio: "UX researcher conducting user studies.", college: "IDC IIT Bombay", degree: "M.Des UX", year: "2nd Year", skills: ["User Research", "Usability Testing", "Figma"], paid: true, min: 1000, max: 6000 },
  { name: "Ravi Shankar", bio: "Network engineer certified in CCNA and CCNP.", college: "NIT Durgapur", degree: "B.Tech ECE", year: "4th Year", skills: ["Networking", "Cisco", "Linux"], paid: false, min: 1000, max: 5000 },
  { name: "Komal Thakur", bio: "WordPress developer and digital marketing consultant.", college: "Christ University", degree: "BCA", year: "3rd Year", skills: ["WordPress", "SEO", "PHP"], paid: true, min: 500, max: 3000 },
  { name: "Akash Jha", bio: "Backend engineer specializing in microservices.", college: "BIT Mesra", degree: "B.Tech CSE", year: "4th Year", skills: ["Spring Boot", "Java", "Kafka"], paid: true, min: 2000, max: 10000 },
  { name: "Prerna Singh", bio: "Voice UI designer working on chatbots.", college: "IIIT Allahabad", degree: "B.Tech IT", year: "3rd Year", skills: ["Chatbots", "Dialogflow", "NLU"], paid: true, min: 1000, max: 5000 },
  { name: "Dhruv Sharma", bio: "Open source contributor with 500+ GitHub contributions.", college: "IIT Mandi", degree: "B.Tech CSE", year: "2nd Year", skills: ["Open Source", "Git", "JavaScript"], paid: false, min: 500, max: 3000 },
  { name: "Bhavna Puri", bio: "Project manager with PMP certification.", college: "SP Jain Mumbai", degree: "MBA", year: "2nd Year", skills: ["Project Management", "Agile", "Scrum"], paid: true, min: 2000, max: 10000 },
  { name: "Sameer Khan", bio: "Ethical hacker and penetration testing specialist.", college: "IIIT Lucknow", degree: "B.Tech CSE", year: "4th Year", skills: ["Ethical Hacking", "Burp Suite", "OWASP"], paid: true, min: 3000, max: 15000 },
  { name: "Ritika Goel", bio: "Frontend developer with expertise in Vue.js.", college: "Thapar University", degree: "B.Tech CSE", year: "3rd Year", skills: ["Vue.js", "Nuxt", "CSS"], paid: true, min: 1000, max: 6000 },
  { name: "Vivek Mishra", bio: "Salesforce developer building CRM solutions.", college: "LPU Punjab", degree: "B.Tech CSE", year: "4th Year", skills: ["Salesforce", "Apex", "Lightning"], paid: true, min: 2000, max: 8000 },
  { name: "Aishwarya Rao", bio: "Technical content creator with 50k YouTube subs.", college: "PES University", degree: "B.Tech CSE", year: "3rd Year", skills: ["Video Production", "Technical Writing", "Teaching"], paid: true, min: 1500, max: 7000 },
  { name: "Naveen Reddy", bio: "Computer vision engineer for autonomous vehicles.", college: "IIT Tirupati", degree: "M.Tech CSE", year: "2nd Year", skills: ["Computer Vision", "OpenCV", "PyTorch"], paid: false, min: 2000, max: 10000 },
  { name: "Sakshi Chawla", bio: "E-commerce developer building Shopify stores.", college: "Chandigarh University", degree: "BCA", year: "3rd Year", skills: ["Shopify", "WooCommerce", "HTML/CSS"], paid: true, min: 800, max: 4000 },
  { name: "Abhishek Soni", bio: "DevSecOps engineer integrating security in CI/CD.", college: "NIT Calicut", degree: "B.Tech CSE", year: "4th Year", skills: ["DevSecOps", "Jenkins", "Security"], paid: true, min: 3000, max: 12000 },
  { name: "Jaya Krishnamurthy", bio: "Bioinformatics researcher applying ML to genomics.", college: "IIT Jodhpur", degree: "M.Tech Biotech", year: "1st Year", skills: ["Bioinformatics", "Python", "R"], paid: false, min: 1000, max: 5000 },
  { name: "Pankaj Dubey", bio: "Angular developer building enterprise dashboards.", college: "IIIT Gwalior", degree: "B.Tech IT", year: "4th Year", skills: ["Angular", "TypeScript", "RxJS"], paid: true, min: 1500, max: 7000 },
  { name: "Mira Chatterjee", bio: "Accessibility advocate for inclusive web experiences.", college: "Jadavpur University", degree: "B.Tech CSE", year: "3rd Year", skills: ["Accessibility", "ARIA", "HTML"], paid: false, min: 500, max: 3000 },
  { name: "Yash Agarwal", bio: "Fintech developer building payment integrations.", college: "IIIT Sri City", degree: "B.Tech CSE", year: "4th Year", skills: ["Stripe", "Payment APIs", "Node.js"], paid: true, min: 2500, max: 12000 },
  { name: "Sunita Mohan", bio: "EdTech developer creating e-learning platforms.", college: "Anna University", degree: "B.Tech CSE", year: "3rd Year", skills: ["React", "EdTech", "LMS"], paid: true, min: 1000, max: 6000 },
  { name: "Kunal Bhatia", bio: "SRE engineer ensuring 99.99% uptime.", college: "DA-IICT", degree: "B.Tech ICT", year: "4th Year", skills: ["SRE", "Monitoring", "Prometheus"], paid: true, min: 4000, max: 18000 },
  { name: "Rekha Pillai", bio: "3D modeler and animator using Blender and Maya.", college: "Arena Animation", degree: "Diploma 3D Animation", year: "2nd Year", skills: ["Blender", "Maya", "3D Animation"], paid: true, min: 800, max: 5000 },
  { name: "Ajay Thakur", bio: "Terraform and Kubernetes specialist.", college: "NIT Hamirpur", degree: "B.Tech CSE", year: "4th Year", skills: ["Terraform", "Kubernetes", "Helm"], paid: true, min: 3000, max: 14000 },
  { name: "Vidya Subramanian", bio: "Technical recruiter and coding bootcamp mentor.", college: "IIM Lucknow", degree: "MBA HR", year: "2nd Year", skills: ["Recruiting", "Mentoring", "Career Coaching"], paid: true, min: 1000, max: 5000 },
  { name: "Shubham Gupta", bio: "Compiler engineer working on LLVM optimizations.", college: "IIT Gandhinagar", degree: "B.Tech CSE", year: "4th Year", skills: ["LLVM", "Compilers", "C++"], paid: false, min: 2000, max: 8000 },
  { name: "Megha Rathi", bio: "Healthcare app developer building compliant solutions.", college: "AIIMS Delhi", degree: "MBBS + Coding", year: "5th Year", skills: ["Healthcare IT", "React", "HIPAA"], paid: true, min: 2000, max: 10000 },
  { name: "Vishal Chauhan", bio: "Music tech developer building audio tools.", college: "IIIT Jabalpur", degree: "B.Tech ECE", year: "3rd Year", skills: ["Audio Processing", "Python", "DSP"], paid: true, min: 1000, max: 5000 },
  { name: "Ankita Pandey", bio: "GraphQL API developer and schema specialist.", college: "KIIT Bhubaneswar", degree: "B.Tech CSE", year: "3rd Year", skills: ["GraphQL", "Apollo", "Node.js"], paid: true, min: 1500, max: 7000 },
  { name: "Saurabh Joshi", bio: "Quantum computing researcher learning Qiskit.", college: "IISc Bangalore", degree: "PhD Physics", year: "2nd Year", skills: ["Quantum Computing", "Qiskit", "Physics"], paid: false, min: 500, max: 3000 },
  { name: "Rashmi Nair", bio: "Startup founder building a social impact platform.", college: "IIT Bombay", degree: "B.Tech + MBA", year: "5th Year", skills: ["Entrepreneurship", "Product Management", "React"], paid: true, min: 5000, max: 25000 },
  { name: "Tarun Malhotra", bio: "Computer graphics engineer working on ray tracing.", college: "IIIT Hyderabad", degree: "M.Tech CSE", year: "1st Year", skills: ["Computer Graphics", "OpenGL", "C++"], paid: false, min: 1500, max: 7000 },
  { name: "Kriti Sharma", bio: "Legal tech developer building contract automation.", college: "NLSIU Bangalore", degree: "BA LLB + Coding", year: "4th Year", skills: ["Legal Tech", "Python", "NLP"], paid: true, min: 2000, max: 9000 },
  { name: "Pranav Deshmukh", bio: "Drone technology developer building flight controllers.", college: "COEP Pune", degree: "B.Tech Mechanical", year: "3rd Year", skills: ["Drones", "Embedded C", "PID Control"], paid: true, min: 1500, max: 7000 },
  { name: "Shalini Mukherjee", bio: "InfoSec analyst with CISSP preparation.", college: "ISI Kolkata", degree: "M.Tech Cryptography", year: "2nd Year", skills: ["Cryptography", "InfoSec", "Python"], paid: false, min: 2000, max: 8000 },
  { name: "Om Prakash", bio: "Low-code/no-code developer building business apps.", college: "SRM University", degree: "B.Tech CSE", year: "2nd Year", skills: ["Bubble", "Airtable", "Zapier"], paid: true, min: 500, max: 3000 },
  { name: "Divyanshi Tripathi", bio: "Sustainability tech developer for carbon tracking.", college: "IIT Dhanbad", degree: "B.Tech Environmental", year: "3rd Year", skills: ["GreenTech", "Python", "Data Analysis"], paid: true, min: 1000, max: 5000 },
  { name: "Kiran Rao", bio: "MLOps engineer deploying models to production.", college: "IIIT Kottayam", degree: "B.Tech CSE", year: "4th Year", skills: ["MLOps", "Docker", "MLflow"], paid: true, min: 2500, max: 11000 },
  { name: "Vandana Singh", bio: "Chatbot developer creating AI customer support.", college: "Amrita University", degree: "B.Tech CSE", year: "3rd Year", skills: ["Chatbots", "LangChain", "Python"], paid: true, min: 1000, max: 6000 },
  { name: "Anand Mishra", bio: "Electronics hobbyist with Arduino projects.", college: "NIT Jamshedpur", degree: "B.Tech ECE", year: "2nd Year", skills: ["Arduino", "Electronics", "PCB Design"], paid: false, min: 500, max: 2000 },
  { name: "Shruti Verma", bio: "Podcast producer and audio engineer.", college: "Xavier Mumbai", degree: "BMM", year: "3rd Year", skills: ["Audio Engineering", "Podcasting", "Sound Design"], paid: true, min: 800, max: 4000 },
  { name: "Hemant Kumar", bio: "SAP consultant with ABAP development.", college: "MANIT Bhopal", degree: "B.Tech CSE", year: "4th Year", skills: ["SAP", "ABAP", "ERP"], paid: true, min: 3000, max: 12000 },
  { name: "Nandini Pillai", bio: "Social computing researcher studying online communities.", college: "IIIT Delhi", degree: "PhD CSE", year: "3rd Year", skills: ["Social Computing", "Data Mining", "Python"], paid: false, min: 1000, max: 5000 },
  { name: "Rohit Garg", bio: "Embedded Linux developer building firmware.", college: "PEC Chandigarh", degree: "B.Tech ECE", year: "4th Year", skills: ["Embedded Linux", "C", "Device Drivers"], paid: true, min: 2000, max: 9000 },
  { name: "Aparna Das", bio: "Smart wearable fabric developer.", college: "NIFT Delhi", degree: "B.Tech Fashion Tech", year: "3rd Year", skills: ["Wearable Tech", "IoT", "Textiles"], paid: true, min: 1000, max: 6000 },
  { name: "Mohit Aggarwal", bio: "Supply chain tech developer for logistics.", college: "IIT Roorkee", degree: "B.Tech Industrial", year: "4th Year", skills: ["Logistics Tech", "Python", "Optimization"], paid: true, min: 2000, max: 10000 },
  { name: "Charvi Jain", bio: "EdTech content developer creating simulations.", college: "BITS Hyderabad", degree: "M.Sc Physics", year: "2nd Year", skills: ["Simulations", "p5.js", "Physics"], paid: true, min: 800, max: 4000 },
  { name: "Tejas Kulkarni", bio: "Performance engineer optimizing web load times.", college: "Walchand Sangli", degree: "B.Tech CSE", year: "4th Year", skills: ["Web Performance", "Lighthouse", "CDN"], paid: true, min: 1500, max: 7000 },
  { name: "Sanya Ahuja", bio: "Cybersecurity analyst monitoring threats.", college: "LNMIIT Jaipur", degree: "B.Tech CSE", year: "3rd Year", skills: ["SIEM", "Threat Analysis", "SOC"], paid: true, min: 2000, max: 8000 },
  { name: "Aryan Srivastava", bio: "API developer building RESTful services.", college: "NIT Patna", degree: "B.Tech IT", year: "3rd Year", skills: ["REST APIs", "Express.js", "Swagger"], paid: true, min: 1000, max: 5000 },
  { name: "Geeta Ramanathan", bio: "Technical translator for Indian languages.", college: "Central University", degree: "MA Linguistics", year: "2nd Year", skills: ["Translation", "Localization", "Hindi"], paid: true, min: 500, max: 3000 },
  { name: "Chetan Bhagat", bio: "WordPress theme developer and web designer.", college: "Lovely Professional", degree: "BCA", year: "3rd Year", skills: ["WordPress", "CSS", "Web Design"], paid: true, min: 500, max: 3000 },
  { name: "Revathi Sundaram", bio: "Agritech developer for precision farming.", college: "TNAU Coimbatore", degree: "B.Tech Agri Eng", year: "4th Year", skills: ["AgriTech", "IoT", "Data Analysis"], paid: true, min: 1000, max: 5000 },
  { name: "Sandeep Mahajan", bio: "RPA developer automating business processes.", college: "MET Mumbai", degree: "B.Tech CSE", year: "4th Year", skills: ["UiPath", "RPA", "Automation"], paid: true, min: 2000, max: 8000 },
  { name: "Fatima Ansari", bio: "Civic tech developer for government portals.", college: "AMU Aligarh", degree: "B.Tech CSE", year: "3rd Year", skills: ["Civic Tech", "React", "Accessibility"], paid: true, min: 1000, max: 5000 },
  { name: "Ashwin Nambiar", bio: "Real-time systems developer for trading platforms.", college: "IIT Palakkad", degree: "B.Tech CSE", year: "4th Year", skills: ["Low Latency", "C++", "WebSocket"], paid: true, min: 4000, max: 18000 },
  { name: "Yamini Rao", bio: "Design systems engineer creating component libs.", college: "CEPT Ahmedabad", degree: "M.Des Interaction Design", year: "2nd Year", skills: ["Design Systems", "Storybook", "React"], paid: true, min: 1500, max: 7000 },
  { name: "Nitin Joshi", bio: "GIS developer building mapping tools.", college: "IIT ISM Dhanbad", degree: "B.Tech Mining", year: "3rd Year", skills: ["GIS", "Mapbox", "QGIS"], paid: true, min: 1000, max: 5000 },
  { name: "Sonia Rawat", bio: "Speech recognition developer for voice assistants.", college: "IIIT Pune", degree: "B.Tech CSE", year: "4th Year", skills: ["Speech Recognition", "Python", "Whisper"], paid: true, min: 2000, max: 9000 },
  { name: "Jayant Mishra", bio: "Photography enthusiast and image processing developer.", college: "NIT Silchar", degree: "B.Tech ECE", year: "3rd Year", skills: ["Image Processing", "OpenCV", "Photography"], paid: true, min: 800, max: 4000 },
  { name: "Tara Singh", bio: "Freelance translator and localization PM.", college: "JNU Delhi", degree: "MA Translation Studies", year: "2nd Year", skills: ["Localization", "Project Management", "i18n"], paid: true, min: 500, max: 3000 },
  { name: "Lokesh Reddy", bio: "Cloud-native developer building serverless apps.", college: "JNTU Hyderabad", degree: "B.Tech CSE", year: "4th Year", skills: ["Serverless", "Lambda", "DynamoDB"], paid: true, min: 2000, max: 10000 },
  { name: "Zara Hussain", bio: "Mental health tech developer for therapy platforms.", college: "Jamia Millia", degree: "B.Tech CSE", year: "3rd Year", skills: ["HealthTech", "React", "Node.js"], paid: true, min: 1500, max: 7000 },
];

const SKILL_LEVELS = ["beginner", "intermediate", "advanced"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: { created: number; failed: number; errors: string[] } = {
      created: 0, failed: 0, errors: [],
    };

    for (let i = 0; i < TEST_USERS.length; i++) {
      const user = TEST_USERS[i];
      const email = `testuser${i + 1}@collabio.test`;
      const password = `TestPass${i + 1}!2024`;

      try {
        // Create auth user (handle_new_user trigger creates profile, availability, reputation)
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: user.name },
        });

        if (authError) {
          if (authError.message?.includes("already been registered")) {
            results.errors.push(`${email}: already exists, skipping`);
            results.failed++;
            continue;
          }
          throw authError;
        }

        const userId = authData.user.id;

        // Update profile with full details
        await adminClient.from("profiles").update({
          full_name: user.name,
          bio: user.bio,
          college: user.college,
          degree: user.degree,
          year: user.year,
          is_paid_available: user.paid,
          min_earning_range: user.min,
          max_earning_range: user.max,
        }).eq("id", userId);

        // Insert skills
        const skillInserts = user.skills.map((skill) => ({
          user_id: userId,
          skill_name: skill,
          level: SKILL_LEVELS[Math.floor(Math.random() * 3)] as "beginner" | "intermediate" | "advanced",
        }));
        await adminClient.from("skills").insert(skillInserts);

        // Update user_availability
        await adminClient.from("user_availability").update({
          learning: Math.random() > 0.3,
          project: Math.random() > 0.3,
          paid_collaboration: user.paid,
          interests: user.skills,
        }).eq("user_id", userId);

        // Update reputation with random data
        await adminClient.from("user_reputation").update({
          points: Math.floor(Math.random() * 500) + 10,
          trust_score: (Math.random() * 3 + 2).toFixed(2),
          total_collaborations: Math.floor(Math.random() * 20),
          total_earnings: user.paid ? Math.floor(Math.random() * 50000) : 0,
        }).eq("user_id", userId);

        results.created++;
      } catch (err) {
        results.failed++;
        results.errors.push(`${email}: ${err.message}`);
      }
    }

    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
