"use client";

import { useState } from "react";
import { WireframeChat } from "./wireframe-chat";
import type { Wireframe } from "@/lib/types";

interface WireframeWithChatProps {
  wireframe: Wireframe;
  projectId: string;
}

export function WireframeWithChat({ wireframe, projectId }: WireframeWithChatProps) {
  const [svg, setSvg] = useState(wireframe.svg);

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
      <h4 className="text-sm font-semibold text-white mb-1">{wireframe.title}</h4>
      <p className="text-xs text-zinc-400 mb-3">{wireframe.description}</p>
      <div
        className="rounded-lg bg-white p-3 flex justify-center"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {wireframe.annotations.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {wireframe.annotations.map((a, j) => (
            <span key={j} className="rounded bg-purple-950 border border-purple-800 px-2 py-0.5 text-[10px] text-purple-300">{a}</span>
          ))}
        </div>
      )}
      <WireframeChat
        projectId={projectId}
        wireframeId={wireframe.id}
        currentSvg={svg}
        onSvgUpdate={setSvg}
      />
    </div>
  );
}
