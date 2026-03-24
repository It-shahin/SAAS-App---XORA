const CommentsPanel = ({ comments, commentText, setCommentText, addProjectComment }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
    <p className="text-gray-400 text-xs uppercase tracking-widest mb-4">Comments</p>
    <div className="flex gap-2 mb-4">
      <input
        type="text"
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && addProjectComment()}
        placeholder="Add a comment..."
        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
      />
      <button onClick={addProjectComment}
        className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
        Post
      </button>
    </div>
    {comments.length > 0 && (
      <div className="flex flex-col gap-3">
        {comments.map((comment) => (
          <div key={comment.$id || comment.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-white text-sm">{comment.text}</p>
            <p className="text-gray-500 text-xs mt-1">{comment.author}</p>
          </div>
        ))}
      </div>
    )}
  </div>
)

export default CommentsPanel
