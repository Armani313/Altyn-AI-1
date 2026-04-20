import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { AGENT_SKILLS_SCHEMA_URL } from '@/lib/agent-ready'

const PUBLIC_SKILLS = [
  {
    name: 'luminify-public-site',
    description:
      'Navigate the public Luminify website and use its public marketing pages and free tools.',
    relativePath: 'public/.well-known/agent-skills/luminify-public-site/SKILL.md',
  },
  {
    name: 'luminify-api',
    description:
      'Discover and authenticate against Luminify HTTP APIs using the published API catalog and OAuth metadata.',
    relativePath: 'public/.well-known/agent-skills/luminify-api/SKILL.md',
  },
  {
    name: 'luminify-billing',
    description:
      'Understand Luminify’s existing billing flows backed by Polar checkout and the customer portal.',
    relativePath: 'public/.well-known/agent-skills/luminify-billing/SKILL.md',
  },
] as const

function sha256Buffer(buffer: Buffer) {
  return `sha256:${createHash('sha256').update(buffer).digest('hex')}`
}

function toAbsoluteUrl(origin: string, pathname: string) {
  return new URL(pathname, `${origin.replace(/\/+$/, '')}/`).toString()
}

export async function getAgentSkillsIndex(origin: string) {
  const skills = await Promise.all(
    PUBLIC_SKILLS.map(async (skill) => {
      const absolutePath = path.join(
        /* turbopackIgnore: true */ process.cwd(),
        skill.relativePath
      )
      const contents = await fs.readFile(absolutePath)

      return {
        name: skill.name,
        type: 'skill-md' as const,
        description: skill.description,
        url: toAbsoluteUrl(origin, `/.well-known/agent-skills/${skill.name}/SKILL.md`),
        digest: sha256Buffer(contents),
      }
    })
  )

  return {
    $schema: AGENT_SKILLS_SCHEMA_URL,
    skills,
  }
}
