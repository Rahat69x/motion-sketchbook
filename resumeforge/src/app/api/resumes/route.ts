import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getResumesByUserId, saveResume } from "@/lib/db";
import { Resume } from "@/lib/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resumes = getResumesByUserId(user.id);
  return NextResponse.json({ resumes });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const title = body.title?.trim() || "Untitled Resume";
    const template = body.template || "modern";

    const newResume: Resume = {
      id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      title,
      template,
      personalInfo: {
        fullName: user.name || "Student Name",
        email: user.email || "student@example.edu",
        phone: "+1 (555) 000-0000",
        location: "City, State",
        linkedin: "linkedin.com/in/username",
        github: "github.com/username",
        portfolio: "myportfolio.dev",
        summary:
          "Motivated computer science student with solid foundation in modern software development and web applications. Eager to contribute to high-impact engineering teams.",
      },
      education: [
        {
          id: `edu_${Date.now()}`,
          institution: user.university || "University Name",
          degree: user.degree || "Bachelor of Science",
          fieldOfStudy: "Computer Science",
          startDate: "Aug 2022",
          endDate: "May 2026",
          gpa: "3.8 / 4.0",
          highlights: "Relevant Coursework: Data Structures, Web Development, Database Systems, Computer Architecture",
        },
      ],
      skills: {
        technical: ["JavaScript", "TypeScript", "Python", "SQL", "Git"],
        frameworks: ["React", "Next.js", "Node.js", "Tailwind CSS"],
        tools: ["VS Code", "Postman", "GitHub", "Linux"],
        soft: ["Problem Solving", "Teamwork", "Agile Collaboration", "Quick Learner"],
      },
      experience: [],
      projects: [
        {
          id: `proj_${Date.now()}`,
          title: "Personal Portfolio & Web Application",
          role: "Developer",
          techStack: ["Next.js", "React", "Tailwind CSS"],
          liveUrl: "https://example.com",
          githubUrl: "https://github.com/username/project",
          description: "Responsive full-stack web application with clean user authentication and live database persistence.",
          bullets: [
            "Built responsive UI components using React and Tailwind CSS.",
            "Designed and implemented RESTful API endpoints for persistent data storage.",
            "Integrated unit tests ensuring seamless user experience across mobile and desktop devices.",
          ],
        },
      ],
      certifications: [],
      achievements: [],
      languages: [{ id: `lang_${Date.now()}`, language: "English", proficiency: "Fluent" }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveResume(newResume);
    return NextResponse.json({ resume: newResume, message: "Resume created successfully." }, { status: 201 });
  } catch (error) {
    console.error("Create resume error:", error);
    return NextResponse.json({ error: "Failed to create resume." }, { status: 500 });
  }
}
