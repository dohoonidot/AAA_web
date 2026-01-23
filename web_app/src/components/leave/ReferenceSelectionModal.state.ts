import { useCallback, useEffect, useMemo, useState } from 'react';
import departmentService from '../../services/departmentService';
import { createLogger } from '../../utils/logger';
import type { CcPerson } from '../../types/leave';

const logger = createLogger('ReferenceSelectionModal');

export const useReferenceSelectionModalState = ({
  open,
  onClose,
  onConfirm,
  currentReferences = [],
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedReferences: CcPerson[]) => void;
  currentReferences?: CcPerson[];
}) => {
  const [selectedReferences, setSelectedReferences] = useState<CcPerson[]>(currentReferences);
  const [departments, setDepartments] = useState<string[]>([]);
  const [departmentMembers, setDepartmentMembers] = useState<Map<string, CcPerson[]>>(new Map());
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDepartmentMembers = useCallback(async (department: string) => {
    try {
      const members = await departmentService.getDepartmentMembers(department);
      const ccPersons: any[] = members.map((member) => ({
        name: member.name,
        department: member.department || department,
        userId: member.userId || member.user_id || member.name,
      }));

      setDepartmentMembers((prev) => {
        const newMap = new Map(prev);
        newMap.set(department, ccPersons);
        return newMap;
      });
    } catch (err: any) {
      logger.error(`부서 멤버 로드 실패 (${department}):`, err);
      setDepartmentMembers((prev) => {
        const newMap = new Map(prev);
        newMap.set(department, []);
        return newMap;
      });
    }
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const deptList = await departmentService.getDepartmentList();
      setDepartments(deptList);

      for (const department of deptList) {
        await loadDepartmentMembers(department);
      }
    } catch (err: any) {
      logger.error('부서 목록 로드 실패:', err);
      setError('부서 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [loadDepartmentMembers]);

  useEffect(() => {
    if (open) {
      setSelectedReferences(currentReferences);
      loadDepartments();
    }
  }, [currentReferences, loadDepartments, open]);

  const toggleDepartmentExpansion = (department: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(department)) {
      newExpanded.delete(department);
    } else {
      newExpanded.add(department);
    }
    setExpandedDepartments(newExpanded);
  };

  const isPersonSelected = (person: CcPerson): boolean => {
    return selectedReferences.some(
      (ref) => ref.name === person.name && ref.department === person.department
    );
  };

  const togglePerson = (person: CcPerson) => {
    const isSelected = isPersonSelected(person);
    if (isSelected) {
      setSelectedReferences((prev) =>
        prev.filter((ref) => !(ref.name === person.name && ref.department === person.department))
      );
    } else {
      setSelectedReferences((prev) => [...prev, person]);
    }
  };

  const isDepartmentFullySelected = (department: string): boolean => {
    const members = departmentMembers.get(department) || [];
    if (members.length === 0) return false;
    return members.every((member) => isPersonSelected(member));
  };

  const toggleDepartment = (department: string) => {
    const members = departmentMembers.get(department) || [];
    const isFullySelected = isDepartmentFullySelected(department);

    if (isFullySelected) {
      setSelectedReferences((prev) => prev.filter((ref) => ref.department !== department));
    } else {
      setSelectedReferences((prev) => {
        const newMembers = members.filter((member) => !isPersonSelected(member));
        return [...prev, ...newMembers];
      });
    }
  };

  const filteredDepartments = useMemo(() => {
    if (!searchText) return departments;

    return departments.filter((dept) => {
      if (dept.toLowerCase().includes(searchText.toLowerCase())) return true;
      const members = departmentMembers.get(dept) || [];
      return members.some((member) => member.name.toLowerCase().includes(searchText.toLowerCase()));
    });
  }, [departments, departmentMembers, searchText]);

  const getFilteredMembers = (department: string): CcPerson[] => {
    const members = departmentMembers.get(department) || [];
    if (!searchText) return members;

    return members.filter((member) =>
      member.name.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedReferences);
    onClose();
  };

  return {
    state: {
      selectedReferences,
      departments,
      departmentMembers,
      expandedDepartments,
      searchText,
      isLoading,
      error,
      filteredDepartments,
    },
    actions: {
      setSearchText,
      loadDepartments,
      toggleDepartmentExpansion,
      isPersonSelected,
      togglePerson,
      isDepartmentFullySelected,
      toggleDepartment,
      getFilteredMembers,
      handleConfirm,
    },
  };
};

export type ReferenceSelectionModalStateHook = ReturnType<typeof useReferenceSelectionModalState>;
