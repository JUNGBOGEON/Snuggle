interface TitleInputProps {
    value: string
    onChange: (value: string) => void
}

export default function TitleInput({ value, onChange }: TitleInputProps) {
    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full border-none bg-transparent text-4xl font-bold text-black placeholder-black/30 outline-none dark:text-white dark:placeholder-white/30"
        />
    )
}
