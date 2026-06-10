import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

interface DispatcherPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

const PAGE_SIZE_OPTIONS = [20, 50, 100];

export function DispatcherPagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: DispatcherPaginationProps) {
  if (total <= 0) {
    return null;
  }

  const safeTotalPages = Math.max(1, totalPages);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <View style={styles.wrap}>
      <Text style={styles.summary}>
        Показано {from}–{to} из {total.toLocaleString('ru-RU')}
        {safeTotalPages > 1 ? ` · страница ${page} из ${safeTotalPages}` : ''}
      </Text>

      {onPageSizeChange ? (
        <View style={styles.sizeRow}>
          <Text style={styles.sizeLabel}>На странице:</Text>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <Pressable
              key={size}
              style={[styles.sizeBtn, size === pageSize && styles.sizeBtnActive]}
              onPress={() => onPageSizeChange(size)}
            >
              <Text style={[styles.sizeBtnText, size === pageSize && styles.sizeBtnTextActive]}>
                {size}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {safeTotalPages > 1 ? (
        <View style={styles.controls}>
          <Pressable
            style={[styles.btn, page <= 1 && styles.btnDisabled]}
            disabled={page <= 1}
            onPress={() => onPageChange(1)}
          >
            <Text style={styles.btnText}>«</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, page <= 1 && styles.btnDisabled]}
            disabled={page <= 1}
            onPress={() => onPageChange(page - 1)}
          >
            <Text style={styles.btnText}>‹</Text>
          </Pressable>
          <Text style={styles.pageNum}>
            {page} / {safeTotalPages}
          </Text>
          <Pressable
            style={[styles.btn, page >= safeTotalPages && styles.btnDisabled]}
            disabled={page >= safeTotalPages}
            onPress={() => onPageChange(page + 1)}
          >
            <Text style={styles.btnText}>›</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, page >= safeTotalPages && styles.btnDisabled]}
            disabled={page >= safeTotalPages}
            onPress={() => onPageChange(safeTotalPages)}
          >
            <Text style={styles.btnText}>»</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 10,
  },
  summary: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  sizeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sizeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sizeBtnText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  sizeBtnTextActive: {
    color: '#fff',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btn: {
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  pageNum: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    minWidth: 64,
    textAlign: 'center',
  },
});
