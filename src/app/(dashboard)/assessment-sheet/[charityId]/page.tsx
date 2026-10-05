import CharitySheetEditor from '@/components/use-case/AssessmentSheet/CharitySheetEditor'
import React from 'react'

type PageProps = {
  params: Promise<{ charityId: string }>
}

export default async function CharityAssessmentSheetPage({ params }: PageProps) {
  const { charityId } = await params
  return <CharitySheetEditor charityId={charityId} />
}
