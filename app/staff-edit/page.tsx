// app/staff-edit/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";

interface Staff {
  id?: string;
  name: string;
  departments: string[]; // 複数の部門情報を保持する
  availablePositions: string[]; // 選択されたポジション名の配列
  experience: number;
}

interface PositionOption {
  id: string;
  name: string;
  departments?: string[];
}

export default function StaffEditPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [positionOptions, setPositionOptions] = useState<PositionOption[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  // 初期値は各項目に1つの空文字（動的入力用）
  const [formData, setFormData] = useState<Staff>({
    name: "",
    departments: [""],
    availablePositions: [""],
    experience: 0,
  });
  // 部門フィルター用の状態（選択されていない場合は空文字＝全体表示）
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");

  // 編集用ヘッダーにスクロールするための ref
  const headerRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    fetchStaff();
    fetchPositions();
  }, []);

  // 部門フィルターを適用したスタッフ一覧を返す
  const filteredStaff = selectedDepartment
    ? staffList.filter((staff) => staff.departments.includes(selectedDepartment))
    : staffList;

  // APIからスタッフ情報を取得
  const fetchStaff = async () => {
    const res = await fetch("/api/staff");
    if (res.ok) {
      const data = await res.json();
      setStaffList(data);
    }
  };

  // APIからポジション情報を取得（departments情報も含む）
  const fetchPositions = async () => {
    const res = await fetch("/api/positions");
    if (res.ok) {
      const data = await res.json();
      // PositionOption の departments フィールドも保持する
      const options = data.map((pos: any) => ({
        id: pos.id,
        name: pos.name,
        departments: pos.departments,
      }));
      setPositionOptions(options);
    }
  };

  // スタッフ情報登録／更新の送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // availablePositions の空文字は除外
    const cleanedPositions = formData.availablePositions.filter(
      (pos) => pos.trim() !== ""
    );
    // departmentsの空文字も除外
    const cleanedDepartments = formData.departments
      .map((d) => d.trim())
      .filter((d) => d !== "");
    const payload = {
      ...formData,
      availablePositions: cleanedPositions,
      departments: cleanedDepartments,
    };

    if (editingId) {
      // 更新の場合：PUTリクエスト
      const res = await fetch("/api/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...payload }),
      });
      if (res.ok) {
        await fetchStaff();
        resetForm();
      }
    } else {
      // 新規登録の場合：POSTリクエスト
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newStaff = await res.json();
        setStaffList([...staffList, newStaff]);
        resetForm();
      }
    }
  };

  // フォームの初期化
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      departments: [""],
      availablePositions: [""],
      experience: 0,
    });
  };

  // スタッフ一覧から編集対象を選択
  const handleEdit = (staff: Staff) => {
    setEditingId(staff.id || null);
    setFormData({
      name: staff.name,
      departments: staff.departments.length > 0 ? [...staff.departments, ""] : [""],
      availablePositions:
        staff.availablePositions.length > 0
          ? [...staff.availablePositions, ""]
          : [""],
      experience: staff.experience,
    });
    headerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 部門入力欄の変更処理（動的入力）
  const handleDepartmentChange = (index: number, value: string) => {
    const newDepartments = [...formData.departments];
    newDepartments[index] = value;
    if (index === newDepartments.length - 1 && value.trim() !== "") {
      newDepartments.push("");
    }
    setFormData({ ...formData, departments: newDepartments });
  };

  // プルダウンの値変更処理（配置可能ポジション部分）
  const handlePositionChange = (index: number, value: string) => {
    const newPositions = [...formData.availablePositions];
    newPositions[index] = value;
    if (index === newPositions.length - 1 && value !== "") {
      newPositions.push("");
    }
    setFormData({ ...formData, availablePositions: newPositions });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* ページ上部の部門フィルター */}
      <div className="mb-4">
        <label className="block mb-1 font-medium">
          部門選択:
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="ml-2 p-2 border border-gray-300 rounded"
          >
            <option value="">全て</option>
            {[...new Set(staffList.flatMap((s) => s.departments))].map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* ここに自動スクロール対象となるヘッダー */}
      <h1 ref={headerRef} className="text-2xl font-bold mb-4">
        スタッフ編集
      </h1>
      <form onSubmit={handleSubmit} className="mb-8 space-y-4 bg-white p-6 shadow rounded">
        <div>
          <label className="block mb-1">スタッフ名:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block mb-1">経験年数:</label>
          <input
            type="number"
            value={formData.experience}
            onChange={(e) =>
              setFormData({
                ...formData,
                experience: Number(e.target.value),
              })
            }
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block mb-1">配属先:</label>
          <div className="space-y-2">
            {formData.departments.map((department, index) => (
              <input
                key={index}
                type="text"
                value={department}
                onChange={(e) => handleDepartmentChange(index, e.target.value)}
                placeholder="例: 病理"
                className="w-full p-2 border border-gray-300 rounded"
              />
            ))}
          </div>
        </div>
        <div>
          <label className="block mb-1">配置可能ポジション:</label>
          <div className="space-y-2">
            {formData.availablePositions.map((pos, index) => (
              <select
                key={index}
                value={pos}
                onChange={(e) => handlePositionChange(index, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">選択してください</option>
                {positionOptions.map((option) => (
                  <option key={option.id} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>
        <div className="space-x-2">
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            {editingId ? "更新" : "登録"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              クリア
            </button>
          )}
        </div>
      </form>

      <h2 className="text-xl font-semibold mb-2">登録済スタッフ一覧</h2>
      <ul className="space-y-2">
        {filteredStaff.map((staff) => (
          <li
            key={staff.id}
            onClick={() => handleEdit(staff)}
            className="cursor-pointer border border-gray-300 p-2 rounded hover:bg-gray-100"
          >
            <div className="font-bold">{staff.name}</div>
            <div>配属先: {(staff.departments || []).join(", ")}</div>
            <div>
              配置可能ポジション:{" "}
              {(staff.availablePositions || [])
                .filter((p) => p.trim() !== "")
                .join(", ")}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
