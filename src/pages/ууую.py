import os
import glob
import numpy as np
import pandas as pd
import tensorflow as tf
tf.config.run_functions_eagerly(True)
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score, f1_score
from tqdm import tqdm

data_path = 'data/wireless'

if not os.path.exists(data_path):
    raise ValueError(f"Папка {data_path} не найдена.")

train_files = glob.glob(os.path.join(data_path, 'scenario*_wireless/dev_data/future-5/scenario*_dev_series_train.csv'))
val_files = glob.glob(os.path.join(data_path, 'scenario*_wireless/dev_data/future-5/scenario*_dev_series_val.csv'))

if not train_files or not val_files:
    raise ValueError("Не найдены CSV-файлы в dev_data/future-5.")

train_df = pd.concat([pd.read_csv(file) for file in train_files], ignore_index=True)
val_df = pd.concat([pd.read_csv(file) for file in val_files], ignore_index=True)

sequence_columns = [f'unit1_pwr_60ghz_{i}' for i in range(1, 9)]

available_files = {}
for scenario in range(17, 23):
    scenario_path = os.path.join(data_path, f'scenario{scenario}_wireless/dev_data/unit1/mmWave_data')
    if os.path.exists(scenario_path):
        files = glob.glob(os.path.join(scenario_path, 'mmWave_power_*.txt'))
        available_files[f'scenario{scenario}'] = set(os.path.basename(f) for f in files)
    else:
        available_files[f'scenario{scenario}'] = set()

def check_file_exists(file_path, scenario_files):
    relative_path = file_path.replace('./unit1/mmWave_data/', '')
    return relative_path in scenario_files

def filter_valid_rows(df, seq_columns, scenario_files):
    return df[df.apply(lambda row: all(check_file_exists(row[col], scenario_files) for col in seq_columns), axis=1)]

def read_power_file(file_path, base_path):
    try:
        relative_path = file_path.replace('./unit1/mmWave_data/', '')
        full_path = os.path.join(base_path, relative_path)
        if os.path.exists(full_path):
            with open(full_path, 'r') as f:
                data = np.array([float(line.strip()) for line in f.readlines() if line.strip()])
                return data if len(data) == 64 else np.zeros(64)
        return np.zeros(64)
    except Exception:
        return np.zeros(64)

def parse_sequence(row, seq_columns, base_path):
    try:
        sequence = np.array([read_power_file(row[col], base_path) for col in seq_columns])
        return sequence if sequence.shape == (8, 64) else np.zeros((8, 64))
    except Exception:
        return np.zeros((8, 64))

X_train_list, y_train_list = [], []
X_val_list, y_val_list = [], []
label_column = 'blockage_5'

for train_file in train_files:
    scenario = os.path.basename(os.path.dirname(os.path.dirname(os.path.dirname(train_file)))).replace('_wireless', '')
    scenario_files = available_files.get(scenario, set())
    if not scenario_files:
        continue
    df = pd.read_csv(train_file)
    base_path = os.path.join(data_path, f'{scenario}_wireless/dev_data/unit1/mmWave_data')
    df_filtered = filter_valid_rows(df, sequence_columns, scenario_files)
    if not df_filtered.empty:
        X = np.array([parse_sequence(row, sequence_columns, base_path) for _, row in df_filtered.iterrows()])
        y = df_filtered[label_column].values
        valid_indices = ~np.all(X == 0, axis=(1, 2))
        X_train_list.append(X[valid_indices])
        y_train_list.append(y[valid_indices])

for val_file in val_files:
    scenario = os.path.basename(os.path.dirname(os.path.dirname(os.path.dirname(val_file)))).replace('_wireless', '')
    scenario_files = available_files.get(scenario, set())
    if not scenario_files:
        continue
    df = pd.read_csv(val_file)
    base_path = os.path.join(data_path, f'{scenario}_wireless/dev_data/unit1/mmWave_data')
    df_filtered = filter_valid_rows(df, sequence_columns, scenario_files)
    if not df_filtered.empty:
        X = np.array([parse_sequence(row, sequence_columns, base_path) for _, row in df_filtered.iterrows()])
        y = df_filtered[label_column].values
        valid_indices = ~np.all(X == 0, axis=(1, 2))
        X_val_list.append(X[valid_indices])
        y_val_list.append(y[valid_indices])

X_train = np.concatenate(X_train_list, axis=0) if X_train_list else np.zeros((0, 8, 64))
y_train = np.concatenate(y_train_list, axis=0) if y_train_list else np.zeros(0)
X_val = np.concatenate(X_val_list, axis=0) if X_val_list else np.zeros((0, 8, 64))
y_val = np.concatenate(y_val_list, axis=0) if y_val_list else np.zeros(0)

if X_train.shape[0] == 0 or X_val.shape[0] == 0:
    raise SystemExit("Нет данных для обучения.")

scaler = MinMaxScaler()
X_train_flat = X_train.reshape(-1, X_train.shape[-1])
X_val_flat = X_val.reshape(-1, X_val.shape[-1])
X_train_normalized = scaler.fit_transform(X_train_flat).reshape(X_train.shape)
X_val_normalized = scaler.transform(X_val_flat).reshape(X_val.shape)

X_all = np.concatenate([X_train_normalized, X_val_normalized], axis=0)
y_all = np.concatenate([y_train, y_val], axis=0)
X_train_final, X_val_final, y_train_final, y_val_final = train_test_split(X_all, y_all, test_size=0.2, random_state=42)

seq_length = 8
features = 64

lstm_input = tf.keras.layers.Input(shape=(seq_length, features))
lstm_output = tf.keras.layers.LSTM(256, return_sequences=True)(lstm_input)
lstm_output = tf.keras.layers.LSTM(128)(lstm_output)
lstm_output = tf.keras.layers.Dense(128, activation='relu')(lstm_output)
lstm_output = tf.keras.layers.Dropout(0.3)(lstm_output)
lstm_output = tf.keras.layers.Dense(1, activation='sigmoid')(lstm_output)
lstm_model = tf.keras.models.Model(inputs=lstm_input, outputs=lstm_output)
lstm_model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.001), loss='binary_crossentropy', metrics=['accuracy'])

cnn_input = tf.keras.layers.Input(shape=(seq_length, features))
cnn_output = tf.keras.layers.Conv1D(128, 3, activation='relu', padding='same')(cnn_input)
cnn_output = tf.keras.layers.BatchNormalization()(cnn_output)
cnn_output = tf.keras.layers.MaxPooling1D(2)(cnn_output)
cnn_output = tf.keras.layers.Conv1D(64, 3, activation='relu', padding='same')(cnn_output)
cnn_output = tf.keras.layers.Conv1D(32, 3, activation='relu', padding='same')(cnn_output)
cnn_output = tf.keras.layers.Flatten()(cnn_output)
cnn_output = tf.keras.layers.Dense(128, activation='relu')(cnn_output)
cnn_output = tf.keras.layers.Dropout(0.3)(cnn_output)
cnn_output = tf.keras.layers.Dense(1, activation='sigmoid')(cnn_output)
cnn_model = tf.keras.models.Model(inputs=cnn_input, outputs=cnn_output)
cnn_model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.001), loss='binary_crossentropy', metrics=['accuracy'])

cnn_lstm_input = tf.keras.layers.Input(shape=(seq_length, features))
cnn_lstm_output = tf.keras.layers.Conv1D(128, 3, activation='relu', padding='same')(cnn_lstm_input)
cnn_lstm_output = tf.keras.layers.BatchNormalization()(cnn_lstm_output)
cnn_lstm_output = tf.keras.layers.MaxPooling1D(2)(cnn_lstm_output)
cnn_lstm_output = tf.keras.layers.LSTM(128, return_sequences=True)(cnn_lstm_output)
cnn_lstm_output = tf.keras.layers.LSTM(64)(cnn_lstm_output)
cnn_lstm_output = tf.keras.layers.Dense(128, activation='relu')(cnn_lstm_output)
cnn_lstm_output = tf.keras.layers.Dropout(0.3)(cnn_lstm_output)
cnn_lstm_output = tf.keras.layers.Dense(1, activation='sigmoid')(cnn_lstm_output)
cnn_lstm_model = tf.keras.models.Model(inputs=cnn_lstm_input, outputs=cnn_lstm_output)
cnn_lstm_model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.001), loss='binary_crossentropy', metrics=['accuracy'])

batch_size = 32
epochs = 50

class_weights = dict(enumerate(compute_class_weight('balanced', classes=np.unique(y_train_final), y=y_train_final)))

lstm_history = lstm_model.fit(X_train_final, y_train_final,
                              validation_data=(X_val_final, y_val_final),
                              batch_size=batch_size,
                              epochs=epochs,
                              class_weight=class_weights,
                              verbose=1)

cnn_history = cnn_model.fit(X_train_final, y_train_final,
                            validation_data=(X_val_final, y_val_final),
                            batch_size=batch_size,
                            epochs=epochs,
                            class_weight=class_weights,
                            verbose=1)

cnn_lstm_history = cnn_lstm_model.fit(X_train_final, y_train_final,
                                      validation_data=(X_val_final, y_val_final),
                                      batch_size=batch_size,
                                      epochs=epochs,
                                      class_weight=class_weights,
                                      verbose=1)

lstm_eval = lstm_model.evaluate(X_val_final, y_val_final)
cnn_eval = cnn_model.evaluate(X_val_final, y_val_final)
cnn_lstm_eval = cnn_lstm_model.evaluate(X_val_final, y_val_final)

print(f"LSTM: Loss = {lstm_eval[0]:.4f}, Accuracy = {lstm_eval[1]:.4f}")
print(f"CNN: Loss = {cnn_eval[0]:.4f}, Accuracy = {cnn_eval[1]:.4f}")
print(f"CNN-LSTM: Loss = {cnn_lstm_eval[0]:.4f}, Accuracy = {cnn_lstm_eval[1]:.4f}")

for name, model in [('LSTM', lstm_model), ('CNN', cnn_model), ('CNN-LSTM', cnn_lstm_model)]:
    y_pred = (model.predict(X_val_final) > 0.5).astype(int)
    print(f"{name} Precision: {precision_score(y_val_final, y_pred):.4f}")
    print(f"{name} Recall: {recall_score(y_val_final, y_pred):.4f}")
    print(f"{name} F1: {f1_score(y_val_final, y_pred):.4f}")

output_dir = 'models'
os.makedirs(output_dir, exist_ok=True)

import tensorflowjs as tfjs
tfjs.converters.save_keras_model(lstm_model, os.path.join(output_dir, 'lstm_model_tfjs'))
tfjs.converters.save_keras_model(cnn_model, os.path.join(output_dir, 'cnn_model_tfjs'))
tfjs.converters.save_keras_model(cnn_lstm_model, os.path.join(output_dir, 'cnn_lstm_model_tfjs'))