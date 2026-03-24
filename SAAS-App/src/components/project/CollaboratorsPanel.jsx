const CollaboratorsPanel = ({ collaborators, inviteEmail, setInviteEmail, addCollaborator }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
    <p className="text-gray-400 text-xs uppercase tracking-widest mb-4">Collaborators</p>
    <p className="text-gray-600 text-xs mb-3">No SMTP configured — invite opens your email client.</p>
    <div className="flex gap-2 mb-4">
      <input
        type="email"
        value={inviteEmail}
        onChange={(e) => setInviteEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && addCollaborator()}
        placeholder="collaborator@email.com"
        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
      />
      <button onClick={addCollaborator}
        className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
        Invite
      </button>
    </div>
    {collaborators.length > 0 && (
      <div className="flex flex-col gap-2">
        {collaborators.map((email) => (
          <div key={email} className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 bg-indigo-500 rounded-full" />
            {email}
          </div>
        ))}
      </div>
    )}
  </div>
)

export default CollaboratorsPanel
