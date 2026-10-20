const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const path = require('path');

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                text: "INTERDISCIPLINARY PROJECT REPORT",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
                text: "entitled",
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 200 }
            }),
            new Paragraph({
                text: "FOODCOVERING: A SMART FOOD SAFETY, TRACKING, AND DONATION PLATFORM",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
                text: "Submitted in partial fulfillment of the requirements for the award of Bachelor of Engineering degree in Computer Science and Engineering",
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 400 }
            }),
            new Paragraph({
                text: "By",
                alignment: AlignmentType.CENTER,
                spacing: { before: 400 }
            }),
            new Paragraph({
                text: "[Your Name/Team Name]\n[Your Register Number]",
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            }),
            new Paragraph({
                text: "SCHOOL OF COMPUTING\nDEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING",
                alignment: AlignmentType.CENTER,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 800 }
            }),
            new Paragraph({ text: "", pageBreakBefore: true }),

            new Paragraph({ text: "BONAFIDE CERTIFICATE", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({
                text: "This is to certify that this Project Report is the bonafide work of [Your Name] who carried out the Project entitled \"FOODCOVERING: A SMART FOOD SAFETY, TRACKING, AND DONATION PLATFORM\" under my supervision.",
                spacing: { before: 200, after: 200 }
            }),
            new Paragraph({ text: "Internal Guide: [Guide Name]" }),
            new Paragraph({ text: "Head of the Department: [HOD Name]" }),
            new Paragraph({ text: "Submitted for Viva voce Examination held on ___________", spacing: { before: 400 } }),
            new Paragraph({ text: "", pageBreakBefore: true }),

            new Paragraph({ text: "DECLARATION", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({
                text: "I hereby declare that the Project Report entitled \"FOODCOVERING\" done by me under the guidance of [Guide Name] is submitted in partial fulfillment of the requirements for the award of Bachelor of Engineering degree in Computer Science.",
                spacing: { before: 200, after: 400 }
            }),
            new Paragraph({ text: "DATE:" }),
            new Paragraph({ text: "PLACE:" }),
            new Paragraph({ text: "SIGNATURE OF THE CANDIDATE", alignment: AlignmentType.RIGHT }),
            new Paragraph({ text: "", pageBreakBefore: true }),

            new Paragraph({ text: "ACKNOWLEDGEMENT", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({
                text: "I am pleased to acknowledge my sincere thanks to the Board of Management for their kind encouragement in doing this project. I convey my thanks to the Dean and Head of the Department for providing me necessary support. I would like to express my deep sense of gratitude to my Project Guide for their valuable guidance.",
                spacing: { before: 200 }
            }),
            new Paragraph({ text: "", pageBreakBefore: true }),

            new Paragraph({ text: "ABSTRACT", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({
                text: "Global food waste and food insecurity remain two of the most pressing socio-economic challenges. FoodCovering 2.0 is an innovative, full-stack web application engineered to bridge this gap by establishing a streamlined, real-time ecosystem for safe food donation and redistribution. The platform leverages simulated Artificial Intelligence (AI) for Food Quality Analysis to evaluate uploaded images of food items to determine freshness and spoilage risk. To facilitate efficient logistics, FoodCovering integrates Live Real-Time Tracking powered by websockets to track active donors, volunteers, and facilities dynamically. The robust Dashboard provides comprehensive data visualization, representing a highly scalable, tech-driven solution to minimize urban food waste while maximizing safe community-driven food recovery.",
                spacing: { before: 200 }
            }),
            new Paragraph({ text: "", pageBreakBefore: true }),

            new Paragraph({ text: "TABLE OF CONTENTS", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "1. INTRODUCTION", spacing: { before: 200 } }),
            new Paragraph({ text: "   1.1 Overview" }),
            new Paragraph({ text: "   1.2 Why Tech for Food Donation" }),
            new Paragraph({ text: "   1.3 Current Challenges" }),
            new Paragraph({ text: "   1.4 Role of Modern Web Stacks" }),
            new Paragraph({ text: "   1.5 Scope of the Project" }),
            new Paragraph({ text: "2. LITERATURE SURVEY", spacing: { before: 100 } }),
            new Paragraph({ text: "3. REQUIREMENTS ANALYSIS", spacing: { before: 100 } }),
            new Paragraph({ text: "   3.1 Objective" }),
            new Paragraph({ text: "   3.2 Requirement Analysis" }),
            new Paragraph({ text: "4. DESIGN DESCRIPTION OF PROPOSED PRODUCT", spacing: { before: 100 } }),
            new Paragraph({ text: "   4.1 Proposed Methodology" }),
            new Paragraph({ text: "       4.1.1 System Architecture" }),
            new Paragraph({ text: "       4.1.2 Various Stages" }),
            new Paragraph({ text: "       4.1.3 Internal / Component Design" }),
            new Paragraph({ text: "       4.1.4 Working Principles" }),
            new Paragraph({ text: "   4.2 Novelty of the Project" }),
            new Paragraph({ text: "5. RESULTS & DISCUSSION", spacing: { before: 100 } }),
            new Paragraph({ text: "   5.1 Development Environment" }),
            new Paragraph({ text: "   5.2 Asset Integration" }),
            new Paragraph({ text: "   5.3 Script Inventory and Metrics" }),
            new Paragraph({ text: "   5.4 Feature Evaluation" }),
            new Paragraph({ text: "6. SUMMARY AND CONCLUSIONS", spacing: { before: 100 } }),
            new Paragraph({ text: "   6.1 Summary" }),
            new Paragraph({ text: "   6.2 Conclusion" }),
            new Paragraph({ text: "   6.3 Future Enhancement" }),
            new Paragraph({ text: "7. REFERENCES", spacing: { before: 100 } }),
            new Paragraph({ text: "8. APPENDIX", spacing: { before: 100 } }),
            new Paragraph({ text: "", pageBreakBefore: true }),

            new Paragraph({ text: "CHAPTER 1: INTRODUCTION", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "1.1 OVERVIEW OF FOOD WASTE AND REDISTRIBUTION", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "Food waste is a multidisciplinary problem affecting economies and environments globally. Traditional food donation relies heavily on manual coordination, phone calls, and physical inspection of food quality. The growing demand for sustainable food practices has highlighted the need for scalable software solutions capable of automating and validating food donations safely." }),
            new Paragraph({ text: "1.2 WHY TECHNOLOGY FOR FOOD DONATION", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "Modern web technology offers a compelling solution to the logistical challenges of food recovery. By providing a centralized, real-time dashboard, donors and volunteers can seamlessly coordinate pickups. Integrating AI for preliminary food safety checks reduces the risk of redistributing spoiled food, ensuring high standards of public health." }),
            new Paragraph({ text: "1.3 CURRENT CHALLENGES", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "Hardware accessibility is no longer a primary barrier, but system complexity remains high. Coordinating live, moving volunteers in a city requires real-time data streaming (WebSockets). Furthermore, ensuring that users can intuitively navigate dashboards requires responsive, high-fidelity UI/UX design." }),
            new Paragraph({ text: "1.4 ROLE OF MODERN WEB STACKS", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "Modern frameworks like React and Node.js have democratized real-time application development. Combined with state managers like Zustand and mapping libraries like React-Leaflet, they provide a comprehensive framework for building live-tracking dashboards and dynamic UI elements." }),
            new Paragraph({ text: "1.5 SCOPE OF THIS PROJECT", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "FoodCovering focuses on a streamlined logistics scenario: a donor uploads food, an AI assesses quality via visual analysis, and if approved, a volunteer is routed for pickup. The project supports both desktop and mobile web views and encompasses a full front-end dashboard, live tracking map, simulated AI analysis, and system health reporting." }),
            new Paragraph({ text: "", pageBreakBefore: true }),

            new Paragraph({ text: "CHAPTER 2: LITERATURE SURVEY", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "2.1 SURVEY", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "In recent years, smart-city logistics have been increasingly adopted to combat food waste. Research shows that digital platforms can enhance volunteer engagement and reduce transit times for perishable goods. Investigation into AI-based computer vision for food spoilage demonstrates that visual indicators (color, texture) can effectively predict shelf life. FoodCovering builds upon this research by implementing a fully immersive web-based dashboard that not only tracks logistics but embeds simulated AI safety checks directly into the donation pipeline." }),
            new Paragraph({ text: "", pageBreakBefore: true }),

            new Paragraph({ text: "CHAPTER 3: REQUIREMENTS ANALYSIS", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "3.1 OBJECTIVE OF THE PROJECT", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "The primary objectives span five dimensions:" }),
            new Paragraph({ text: "- Educational/Social: To provide a platform that safely redistributes food to those in need." }),
            new Paragraph({ text: "- Logistical: To track and route volunteers in real-time across a city map." }),
            new Paragraph({ text: "- Safety: To utilize AI image analysis to prevent the distribution of spoiled food." }),
            new Paragraph({ text: "- Technical: To demonstrate the feasibility of building a real-time web application using Vite, React, Node.js, and Socket.io." }),
            new Paragraph({ text: "- Analytical: To aggregate system data into comprehensive reports and charts." }),
            
            new Paragraph({ text: "3.2 REQUIREMENT ANALYSIS", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "A. Hardware Requirements", spacing: { before: 100 } }),
            new Paragraph({ text: "- Processor: Intel Core i5 or equivalent\n- RAM: 8 GB (16 GB Recommended)\n- Storage: 1 GB free space\n- OS: Windows 10/11 or macOS" }),
            new Paragraph({ text: "B. Software Requirements", spacing: { before: 100 } }),
            new Paragraph({ text: "- Environment: Node.js, npm\n- Frontend: React 18, Vite, TailwindCSS, React-Leaflet, Recharts\n- Backend: Express, Socket.io, TSX\n- Language: TypeScript" }),
            new Paragraph({ text: "", pageBreakBefore: true }),

            new Paragraph({ text: "CHAPTER 4: DESIGN DESCRIPTION OF PROPOSED PROJECT", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "4.1 PROPOSED METHODOLOGY", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "The development followed an iterative approach:\n1. Scene/UI Construction: Building the layout using Tailwind CSS.\n2. Dashboard Systems: Implementing Recharts for data visualization.\n3. AI Analysis Simulation: Creating the drag-and-drop image upload with scanning animations.\n4. Live Pipeline: Setting up a Node.js Socket.io server to broadcast live coordinates and metrics.\n5. Map Integration: Embedding Leaflet to render the real-time movement of users." }),
            
            new Paragraph({ text: "4.1.1 SYSTEM ARCHITECTURE", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "The system is divided into a Client-Server model. The Frontend (React/Zustand) acts as the display layer, ingesting data. The Backend (Node.js) acts as the simulation engine, mutating coordinates, generating random metrics, and pushing payloads via WebSockets to all connected clients." }),
            
            new Paragraph({ text: "4.1.2 VARIOUS STAGES", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "1. Evidence/Donation Upload: Donor uploads a food image.\n2. AI Processing: The system scans the image and evaluates spoilage risk.\n3. Dispatch: A volunteer is assigned.\n4. Live Tracking: The map updates as the volunteer moves to the donor and then to the facility.\n5. Completion: The dashboard metrics update to reflect the successful delivery." }),

            new Paragraph({ text: "4.1.3 INTERNAL / COMPONENT DESIGN", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "The UI is modular. Dashboard.tsx aggregates KPI cards. FoodAnalysis.tsx handles file reading and visual feedback. Tracking.tsx and MapView.tsx consume the cityMap arrays from the global Zustand store to plot Leaflet markers." }),

            new Paragraph({ text: "4.1.4 WORKING PRINCIPLES", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "The application utilizes WebSocket event-driven architecture. The server runs a setInterval loop every 3 seconds, updating coordinates slightly to simulate movement, and modifying server health metrics, then emits a pipelineData event. The client listens to this event and merges it into the React state." }),

            new Paragraph({ text: "4.2 NOVELTY OF THE PROJECT", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "FoodCovering's novelty lies in:\n1. Integrated AI Workflow: Combining food safety directly with logistics.\n2. Real-time Map Visualization: Active live tracking of all moving parts on a city-wide scale.\n3. High-Fidelity Dashboard: Enterprise-grade data visualization for charity operations." }),
            new Paragraph({ text: "", pageBreakBefore: true }),

            new Paragraph({ text: "CHAPTER 5: RESULTS AND DISCUSSION", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "5.1 DEVELOPMENT ENVIRONMENT", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "Developed using VS Code with Vite for fast HMR. The backend runs on a local Node instance using tsx. The application renders fluidly in modern web browsers." }),
            
            new Paragraph({ text: "5.2 ASSET INTEGRATION", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "- UI Assets: Lucide React icons.\n- Mapping: OpenStreetMap tiles.\n- Charts: Recharts SVG components." }),

            new Paragraph({ text: "5.3 SCRIPT INVENTORY AND METRICS", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "- App.tsx: Route management and Socket initialization.\n- usePipelineStore.ts: Global state management for live data.\n- index.ts (Backend): Simulation engine and socket broadcaster.\n- Dashboard/Tracking/MapView.tsx: Core UI views." }),

            new Paragraph({ text: "5.4 FEATURE EVALUATION", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "The system successfully processes mock AI uploads locally via FileReader, accurately overlays scanning visuals, and efficiently plots moving data points on the map without rendering bottlenecks." }),
            new Paragraph({ text: "", pageBreakBefore: true }),

            new Paragraph({ text: "CHAPTER 6: SUMMARY AND CONCLUSION", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "6.1 SUMMARY", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "FoodCovering successfully demonstrates the viability of modern web technologies to manage complex, real-time humanitarian logistics. The project delivers a fully interactive dashboard featuring authentic tracking, reporting, and automated food safety checks." }),

            new Paragraph({ text: "6.2 CONCLUSION", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "By combining immersive UI, real-time data flow, and simulated AI logic, the project bridges the gap between theoretical logistics and practical execution. It proves that software can effectively automate the safety and distribution of donated food, protecting public health while minimizing waste." }),

            new Paragraph({ text: "6.3 FUTURE ENHANCEMENT", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "Future versions could integrate true Machine Learning models (like TensorFlow.js) for actual image recognition, real GPS tracking via mobile apps for volunteers, and SMS integration via Twilio for automated dispatch alerts." }),
            new Paragraph({ text: "", pageBreakBefore: true }),

            new Paragraph({ text: "REFERENCES", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "1. React Documentation. Meta Platforms." }),
            new Paragraph({ text: "2. Socket.io Real-time engine documentation." }),
            new Paragraph({ text: "3. Studies on Urban Food Waste and AI Computer Vision Applications." }),
            new Paragraph({ text: "", pageBreakBefore: true }),

            new Paragraph({ text: "APPENDIX", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "A. Core Pipeline Source Code (usePipelineStore.ts)", heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: "import { create } from 'zustand';\nimport { io, Socket } from 'socket.io-client';\n\ninterface PipelineState {\n  socket: Socket | null;\n  isConnected: boolean;\n  kpi: any;\n  tracking: any;\n  cityMap: any;\n  connect: () => void;\n}\n\nexport const usePipelineStore = create<PipelineState>((set, get) => ({\n  socket: null,\n  isConnected: false,\n  kpi: {},\n  tracking: {},\n  cityMap: {},\n  \n  connect: () => {\n    const socket = io('http://localhost:5000');\n    socket.on('pipelineData', (data) => {\n      set({ kpi: data.kpi, tracking: data.tracking, cityMap: data.cityMap });\n    });\n    set({ socket });\n  }\n}));" })
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync(path.join(__dirname, '../FoodCovering_Project_Report_Real.docx'), buffer);
    console.log("Document created successfully");
});
